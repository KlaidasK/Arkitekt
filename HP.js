const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing
const port = 3019;

const app = express();

// Middleware
app.use(express.static(__dirname));
app.use(bodyParser.json()); // Parse JSON data
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/users', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("MongoDB connection successful");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  password: { type: String, required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  gender: { type: String, required: true },
  goal: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Serve the registration page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle form submission
app.post('/register', async (req, res) => {
  const { username, password, dob, height, weight, gender, goal } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      // If the username already exists, send an error response
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // If the username is unique, create a new user
    const newUser = new User({
      username,
      password: hashedPassword, // Save the hashed password
      dob,
      height,
      weight,
      gender,
      goal
    });

    // Save the new user to the database
    await newUser.save();

    // Send a success response
    res.status(201).json({ success: true, message: 'User registered successfully!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to check if username is taken
app.get('/check-username', async (req, res) => {
  const { username } = req.query;
  try {
    const user = await User.findOne({ username });
    res.json({ isTaken: user !== null });
  } catch (err) {
    console.error("Error checking username:", err);
    res.status(500).json({ isTaken: false });
  }
});

// Sign-in endpoint
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Compare the entered password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // If the username and password are valid, send success response
    res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Fetch user profile based on username
app.get('/get-user-profile', async (req, res) => {
  const { username } = req.query;

  try {
      const user = await User.findOne({ username });

      if (!user) {
          return res.status(404).json({ error: 'User not found.' });
      }

      // Return all user profile data (username, dob, height, weight, gender, goal)
      res.status(200).json({
          username: user.username,
          dob: user.dob,
          height: user.height,
          weight: user.weight,
          gender: user.gender,
          goal: user.goal
      });
  } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Server error.' });
  }
});



app.post('/update-user-profile', async (req, res) => {
    const { username, newDob, weight, height, gender, goal, newPassword } = req.body;

    try {
        // Find the user in the database
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If a new password is provided, hash it before saving
        let updatedPassword = user.password;  // Keep the current password if no new one is provided
        if (newPassword) {
            updatedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
        }

        // Update the user profile
        user.dob = newDob || user.dob;
        user.weight = weight || user.weight;
        user.height = height || user.height;
        user.gender = gender || user.gender;
        user.goal = goal || user.goal;
        user.password = updatedPassword;  // Update password if new password was provided

        // Save the updated user data
        await user.save();

        // Respond with success
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'An error occurred while updating the profile.' });
    }
});



// Add an endpoint to get the stored old password (this should be done securely)
app.get('/get-old-password', async (req, res) => {
  const { username } = req.query;

  try {
      const user = await User.findOne({ username });

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Send the hashed password (note: compare hashed passwords on the server side)
      res.status(200).json({ success: true, password: user.password });
  } catch (error) {
      console.error('Error fetching old password:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

// Password verification endpoint
app.get('/verify-old-password', async (req, res) => {
  const { username, password } = req.query;

  try {
      const user = await User.findOne({ username });

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Compare the entered password with the hashed password stored in DB
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
          return res.status(200).json({ success: true });
      } else {
          return res.status(400).json({ error: 'Old password is incorrect' });
      }
  } catch (error) {
      console.error('Error verifying old password:', error);
      return res.status(500).json({ error: 'Server error' });
  }
});

// Delete user account and associated daily logs endpoint
app.delete('/delete-user-account', async (req, res) => {
  const { username } = req.query;  // Get the username from the query string

  // Check if the username is provided
  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    // Find and delete the user from the database
    const deletedUser = await User.findOneAndDelete({ username });

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Delete the daily logs associated with this user
    await DailyLog.deleteMany({ username });

    // Respond with success message
    res.status(200).json({ success: true, message: 'User account and daily logs deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user account and daily logs:', error);
    res.status(500).json({ error: 'Server error while deleting the account and daily logs.' });
  }
});





const dailyLogSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Link to the user
  date: { type: Date, required: true, default: Date.now }, // Log date, defaults to current date
  steps: { type: Number, required: true, min: 0 }, // Steps walked
  workout: {
    type: String, // Type of workout (e.g., "Cardio Workouts")
    enum: [
      "None",
      "Back Workouts",
      "Chest Workouts",
      "Leg Workouts",
      "Arm Workouts",
      "Core Workouts",
      "Cardio Workouts",
      "Full-Body Workouts",
      "Flexibility and Mobility Workouts",
    ],
    required: true,
  },
  workoutDuration: { type: Number, required: true, min: 0 }, // Duration in minutes
  sleepHours: { type: Number, required: true, min: 0, max: 24 }, // Sleep hours (0-24 range)
});

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);

module.exports = DailyLog;



app.post('/log-activity', async (req, res) => {
  const { username, logDate, steps, workout, workoutDuration, sleep } = req.body;

  // Check if all required fields are present
  if (!username || !steps || !workout || !workoutDuration || !sleep) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // If logDate is provided, use it; otherwise, default to today's date
  const activityDate = logDate ? new Date(logDate) : new Date();

  // Adjust to the local time zone (assuming local time zone is desired)
  const localDate = new Date(activityDate.setHours(0, 0, 0, 0));  // Set to midnight local time
  
  // Convert the local date to UTC by adjusting the timezone offset
  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);  // Convert to UTC

  try {
    // Find an existing log for the user on the selected date in UTC
    const existingLog = await DailyLog.findOne({ 
      username, 
      date: { $gte: utcDate, $lt: new Date(utcDate).setDate(utcDate.getDate() + 1) }
    });

    if (existingLog) {
      // Log already exists, update it
      existingLog.steps = steps;
      existingLog.workout = workout;
      existingLog.workoutDuration = workoutDuration;
      existingLog.sleepHours = sleep;

      // Save the updated log
      const updatedLog = await existingLog.save();

      return res.status(200).json({
        success: true,
        message: 'Activity log updated successfully.',
        updatedLog
      });
    } else {
      // Log does not exist, create a new one
      const newLog = new DailyLog({
        username,
        date: utcDate, // Save the date in UTC
        steps,
        workout,
        workoutDuration,
        sleepHours: sleep
      });

      // Save the new log
      const savedLog = await newLog.save();

      return res.status(201).json({
        success: true,
        message: 'Activity log created successfully.',
        savedLog
      });
    }
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Server error while logging activity.' });
  }
});










app.get('/get-daily-log', async (req, res) => {
  const { username, date } = req.query; // Fetch the date from query params

  // Check if the date is provided, otherwise use today's date
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0); // Reset time part to midnight

  try {
    // Find an existing log for the user on the given date
    const log = await DailyLog.findOne({ 
      username, 
      date: { $gte: targetDate, $lt: new Date(targetDate).setDate(targetDate.getDate() + 1) } 
    });

    if (log) {
      return res.status(200).json({
        success: true,
        log,
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "No log for this date.",
      });
    }
  } catch (error) {
    console.error('Error fetching daily log:', error);
    res.status(500).json({ error: 'Server error while fetching the log.' });
  }
});



app.delete('/delete-daily-log', async (req, res) => {
  const { username, date } = req.body;

  if (!username || !date) {
      return res.status(400).json({ error: 'Username and date are required.' });
  }

  try {
      // Convert the date string to a Date object
      const logDate = new Date(date);

      if (isNaN(logDate.getTime())) {
          return res.status(400).json({ error: 'Invalid date format.' });
      }

      const deletedLog = await DailyLog.findOneAndDelete({ username, date: logDate });

      if (!deletedLog) {
          return res.status(404).json({ error: 'Log not found.' });
      }

      res.status(200).json({ success: true, message: 'Daily log deleted successfully.' });
  } catch (error) {
      console.error('Error deleting daily log:', error);
      res.status(500).json({ error: 'Server error while deleting daily log.' });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
