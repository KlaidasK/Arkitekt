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


// Endpoint to get step progress
app.get("/get-step-progress", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }

  try {
    // Get the earliest and latest step logs
    const earliestLog = await DailyLog.findOne({ username }).sort({ date: 1 });
    const latestLog = await DailyLog.findOne({ username }).sort({ date: -1 });

    if (!earliestLog || !latestLog) {
      return res
        .status(404)
        .json({ error: "No step data found for the user." });
    }

    const stepProgress = latestLog.steps - earliestLog.steps;

    res.json({
      success: true,
      initialSteps: earliestLog.steps,
      latestSteps: latestLog.steps,
      progress: stepProgress,
    });
  } catch (error) {
    console.error("Error fetching step progress:", error);
    res.status(500).json({ error: "Server error while fetching step progress." });
  }
});


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


// Nutrient Log Schema
const nutrientLogSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Link to the user
  date: { type: Date, required: true, default: Date.now }, // Log date
  calories: { type: Number, required: true, min: 0 }, // Calories consumed
  protein: { type: Number, required: true, min: 0 }, // Protein in grams
  fats: { type: Number, required: true, min: 0 }, // Fats in grams
  carbohydrates: { type: Number, required: true, min: 0 }, // Carbohydrates in grams
  water: { type: Number, required: true, min: 0 }, // Water intake in liters
});

const NutrientLog = mongoose.model('NutrientLog', nutrientLogSchema);

// Nutrient Goals Schema
const nutrientGoalsSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Link to the user
  caloriesGoal: { type: Number, default: true, min: 0 }, // calories goal
  proteinGoal: { type: Number, default: true, min: 0 }, //protein goal
  fatsGoal: { type: Number, default: true, min: 0 }, // fats goal
  carbohydratesGoal: { type: Number, default: true, min: 0 }, // carbohydrates goal
  waterGoal: { type: Number, default: true, min: 0 }, // water goal
  weightGoal: { type: Number, default: true, min: 0 }, // weight goal
});

const NutrientGoals = mongoose.model('NutrientGoals', nutrientGoalsSchema);

module.exports = { NutrientLog, NutrientGoals };

app.get('/get-calorie-goal', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required' });
  }

  try {
    // Find the nutrient goals for the user
    const nutrientGoals = await NutrientGoals.findOne({ username: username });

    if (!nutrientGoals) {
      return res.status(404).json({ success: false, error: 'Nutrient goals not found for this user' });
    }

    // Return the calorie goal for the user
    return res.json({
      success: true,
      calorieGoal: nutrientGoals.caloriesGoal,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Error fetching calorie goal' });
  }
});

app.get('/get-weekly-calories', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required' });
  }

  try {
    // Get the date for one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Fetch the nutrient logs for the past week for the given user
    const logs = await NutrientLog.find({
      username: username,
      date: { $gte: oneWeekAgo },  // Filter logs from the last 7 days
    }).sort({ date: 1 });  // Sort by date ascending

    // Map logs to return only the date and calories
    const totalCalories = logs.map(log => ({
      date: log.date,
      calories: log.calories
    }));

    // Return the result as a response
    return res.json({
      success: true,
      logs: totalCalories,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Error fetching weekly calories' });
  }
});

app.get('/get-monthly-calories', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required' });
  }

  try {
    // Get the date for one month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);  // Subtract one month from the current date

    // Fetch the nutrient logs for the past month for the given user
    const logs = await NutrientLog.find({
      username: username,
      date: { $gte: oneMonthAgo },  // Filter logs from the last 30 days
    }).sort({ date: 1 });  // Sort by date ascending

    // Map logs to return only the date and calories
    const totalCalories = logs.map(log => ({
      date: log.date,
      calories: log.calories
    }));

    // Return the result as a response
    return res.json({
      success: true,
      logs: totalCalories,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Error fetching monthly calories' });
  }
});

app.get('/get-weekly-nutrients', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required' });
  }

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Get date for one week ago

    // Fetch the nutrient logs for the past week
    const logs = await NutrientLog.find({
      username: username,
      date: { $gte: oneWeekAgo },
    }).sort({ date: 1 });

    // Calculate the weekly averages for protein, carbs, and fats
    let totalProtein = 0, totalCarbs = 0, totalFat = 0;
    logs.forEach(log => {
      totalProtein += log.protein;
      totalCarbs += log.carbohydrates;
      totalFat += log.fats;
    });

    const averageProtein = totalProtein / logs.length;
    const averageCarbs = totalCarbs / logs.length;
    const averageFat = totalFat / logs.length;

    return res.json({
      success: true,
      averages: {
        protein: averageProtein,
        carbs: averageCarbs,
        fat: averageFat,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Error fetching weekly nutrients' });
  }
});

app.get('/get-monthly-nutrients', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required' });
  }

  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);  // Get date for one month ago

    // Fetch the nutrient logs for the past month
    const logs = await NutrientLog.find({
      username: username,
      date: { $gte: oneMonthAgo },
    }).sort({ date: 1 });

    // Calculate the monthly averages for protein, carbs, and fats
    let totalProtein = 0, totalCarbs = 0, totalFat = 0;
    logs.forEach(log => {
      totalProtein += log.protein;
      totalCarbs += log.carbohydrates;
      totalFat += log.fats;
    });

    const averageProtein = totalProtein / logs.length;
    const averageCarbs = totalCarbs / logs.length;
    const averageFat = totalFat / logs.length;

    return res.json({
      success: true,
      averages: {
        protein: averageProtein,
        carbs: averageCarbs,
        fat: averageFat,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Error fetching monthly nutrients' });
  }
});


// Example API route to get calorie progress data
app.get('/get-calories-intake', async (req, res) => {
  const username = req.query.username;

  try {
    // Fetch all nutrient logs for the user, sorted by date ascending (earliest first)
    const nutrientLogs = await NutrientLog.find({ username: username }).sort({ date: 1 });

    if (!nutrientLogs || nutrientLogs.length === 0) {
      return res.json({ success: false, message: 'No calorie intake data found for this user.' });
    }

    // Get the initial (earliest) and latest calorie intake
    const initialCalories = nutrientLogs[0].calories; // First log (earliest)
    const latestCalories = nutrientLogs[nutrientLogs.length - 1].calories; // Last log (latest)

    // Calculate progress (latest - initial)
    const progress = latestCalories - initialCalories;

    // Fetch the user's nutrient goal data (to compare with actual intake)
    const nutrientGoalData = await NutrientGoals.findOne({ username: username });

    if (!nutrientGoalData) {
      return res.json({ success: false, message: 'No nutrient goals found for this user.' });
    }

    // Send the response with initial and latest calorie intake, progress, and the goal
    res.json({
      success: true,
      calorieGoal: nutrientGoalData.caloriesGoal,
      initialCalories: initialCalories,
      latestCalories: latestCalories,
      progress: progress,
    });

  } catch (error) {
    console.error(error);
    res.json({ success: false, error: error.message });
  }
});




app.post('/log-nutrients', async (req, res) => {
  const { username, logDate, calories, protein, fats, carbohydrates, water } = req.body;

  if (!username || !calories || !protein || !fats || !carbohydrates || !water) {
    return res.status(400).json({ error: 'All nutrient fields are required.' });
  }

  const activityDate = logDate ? new Date(logDate) : new Date();
  const localDate = new Date(activityDate.setHours(0, 0, 0, 0));
  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);

  try {
    const existingLog = await NutrientLog.findOne({
      username,
      date: { $gte: utcDate, $lt: new Date(utcDate).setDate(utcDate.getDate() + 1) },
    });

    if (existingLog) {
      // Update existing log
      existingLog.calories = calories;
      existingLog.protein = protein;
      existingLog.fats = fats;
      existingLog.carbohydrates = carbohydrates;
      existingLog.water = water;

      const updatedLog = await existingLog.save();
      return res.status(200).json({
        success: true,
        message: 'Nutrient log updated successfully.',
        updatedLog,
      });
    } else {
      // Create new log
      const newLog = new NutrientLog({
        username,
        date: utcDate,
        calories,
        protein,
        fats,
        carbohydrates,
        water,
      });

      const savedLog = await newLog.save();
      return res.status(201).json({
        success: true,
        message: 'Nutrient log created successfully.',
        savedLog,
      });
    }
  } catch (error) {
    console.error('Error logging nutrients:', error);
    res.status(500).json({ error: 'Server error while logging nutrients.' });
  }
});



app.get('/get-nutrient-log', async (req, res) => {
  const { username, date } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required.' });
  }

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  try {
    const log = await NutrientLog.findOne({
      username,
      date: { $gte: targetDate, $lt: new Date(targetDate).setDate(targetDate.getDate() + 1) },
    });

    if (log) {
      return res.status(200).json({ success: true, log });
    } else {
      return res.status(200).json({
        success: false,
        message: 'No log found for this date.',
      });
    }
  } catch (error) {
    console.error('Error fetching nutrient log:', error);
    res.status(500).json({ error: 'Server error while fetching nutrient log.' });
  }
});

app.post('/set-nutrient-goals', async (req, res) => {
  const { username, caloriesGoal, proteinGoal, fatsGoal, carbohydratesGoal, waterGoal, weightGoal } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    const existingGoals = await NutrientGoals.findOne({ username });

    if (existingGoals) {
      // Update existing goals
      existingGoals.caloriesGoal = caloriesGoal !== undefined ? caloriesGoal : existingGoals.caloriesGoal;
      existingGoals.proteinGoal = proteinGoal !== undefined ? proteinGoal : existingGoals.proteinGoal;
      existingGoals.fatsGoal = fatsGoal !== undefined ? fatsGoal : existingGoals.fatsGoal;
      existingGoals.carbohydratesGoal = carbohydratesGoal !== undefined ? carbohydratesGoal : existingGoals.carbohydratesGoal;
      existingGoals.waterGoal = waterGoal !== undefined ? waterGoal : existingGoals.waterGoal;
      existingGoals.weightGoal = weightGoal !== undefined ? weightGoal : existingGoals.weightGoal;

      const updatedGoals = await existingGoals.save();
      return res.status(200).json({
        success: true,
        message: 'Nutrient goals updated successfully.',
        updatedGoals,
      });
    } else {
      // Create new goals
      const newGoals = new NutrientGoals({
        username,
        caloriesGoal,
        proteinGoal,
        fatsGoal,
        carbohydratesGoal,
        waterGoal,
        weightGoal,
      });

      const savedGoals = await newGoals.save();
      return res.status(201).json({
        success: true,
        message: 'Nutrient goals set successfully.',
        savedGoals,
      });
    }
  } catch (error) {
    console.error('Error setting nutrient goals:', error);
    res.status(500).json({ error: 'Server error while setting nutrient goals.' });
  }
});


app.get('/get-nutrient-goals', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required.' });
  }

  try {
    const goals = await NutrientGoals.findOne({ username });

    if (goals) {
      return res.status(200).json({
        success: true,
        goals,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'No nutrient goals found for this user.',
      });
    }
  } catch (error) {
    console.error('Error fetching nutrient goals:', error);
    res.status(500).json({ error: 'Server error while fetching nutrient goals.' });
  }
});


const weightSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Link to the user
  date: { type: Date, required: true, default: Date.now }, // Log date
  weight: { type: Number, required: true, min: 30, max: 300 }, // User's logged weight
});

const weightLog = mongoose.model('weightLog', weightSchema);

module.exports = { weightLog };

app.post('/log-weight', async (req, res) => {
  const { username, logDate, weight } = req.body;

  if (!username || !weight) {
    return res.status(400).json({ error: 'Username and weight are required.' });
  }

  try {
    // Normalize log date to UTC
    const weightDate = logDate ? new Date(logDate) : new Date();
    const normalizedDate = new Date(weightDate.setUTCHours(0, 0, 0, 0));

    console.log('Normalized Date:', normalizedDate);

    // Check if a log already exists for the same user and date
    const existingLog = await weightLog.findOne({
      username,
      date: normalizedDate,
    });

    if (existingLog) {
      console.log('Existing Log:', existingLog);

      // Use updateOne to update the log
      const result = await weightLog.updateOne(
        { username, date: normalizedDate },  // Find the existing log
        { $set: { weight } }  // Update the weight field
      );

      if (result.nModified === 0) {
        return res.status(400).json({ error: 'Weight value is the same as the existing one. No update needed.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Weight log updated successfully.',
      });
    } else {
      // Create a new log
      const newLog = new weightLog({
        username,
        date: normalizedDate,
        weight,
      });
      const savedLog = await newLog.save();
      return res.status(201).json({
        success: true,
        message: 'Weight log created successfully.',
        savedLog,
      });
    }
  } catch (error) {
    console.error('Error logging weight:', error);
    return res.status(500).json({ error: 'Server error while logging weight.' });
  }
});



// Get the latest weight for the user
app.get("/get-latest-weight", async (req, res) => {
  try {
      const username = req.query.username;
      const latestWeight = await weightLog.findOne({ username }).sort({ date: -1 });
      if (!latestWeight) return res.status(404).json({ error: "No weight data found" });

      res.json(latestWeight);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
  }
});

app.get('/get-weight-log', async (req, res) => {
  const { username, date } = req.query;

  if (!username || !date) {
      return res.status(400).json({ error: 'Username and date are required.' });
  }

  try {
      // Normalize the date to UTC (set to midnight)
      const dateObj = new Date(date);
      const normalizedDate = new Date(dateObj.setUTCHours(0, 0, 0, 0));

      // Find the weight log for the specific username and normalized date
      const weightLogEntry = await weightLog.findOne({
          username,
          date: normalizedDate,
      });

      if (weightLogEntry) {
          return res.status(200).json({
              success: true,
              log: weightLogEntry,
          });
      } else {
          return res.status(404).json({
              success: false,
              message: 'No weight log found for this date.',
          });
      }
  } catch (error) {
      console.error('Error fetching weight log:', error);
      return res.status(500).json({ error: 'Server error while fetching weight log.' });
  }
});


app.get('/get-weekly-weight', async (req, res) => {
  const { username } = req.query;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
      const logs = await weightLog.find({
          username,
          date: { $gte: oneWeekAgo }
      }).sort({ date: 1 }); // Sort by date ascending

      res.status(200).json({ success: true, logs });
  } catch (error) {
      console.error('Error fetching weekly weight logs:', error);
      res.status(500).json({ error: 'Server error while fetching weekly weight logs.' });
  }
});

app.get('/get-monthly-weight', async (req, res) => {
  const { username } = req.query;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // Get the date 1 month ago

  try {
      // Fetch weight logs for the last month
      const logs = await weightLog.find({
          username,
          date: { $gte: oneMonthAgo } // Fetch logs from the last month
      }).sort({ date: 1 }); // Sort by date ascending

      res.status(200).json({ success: true, logs });
  } catch (error) {
      console.error('Error fetching monthly weight logs:', error);
      res.status(500).json({ error: 'Server error while fetching monthly weight logs.' });
  }
});

const workoutSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Link to the user
  name: { type: String, required: true }, // Workout name (required)
  exercises: { type: String, required: true }, // Free-text string for exercises (required)
  duration: { type: Number, required: true, min: 0 }, // Duration in minutes (required, must be >= 0)
  intensity: { type: String, enum: ['Low', 'Medium', 'High'], required: true }, // Workout intensity (required)
  date: { type: Date, default: Date.now }, // Log date (default to current date)
});

workoutSchema.index({ username: 1, name: 1 }, { unique: true });

// Custom validation to limit workouts per user to 10
workoutSchema.pre('save', async function(next) {
  const workoutCount = await mongoose.model('Workout').countDocuments({ username: this.username });
  if (workoutCount >= 10) {
    const err = new Error('A user can have a maximum of 10 workout plans.');
    next(err);
  } else {
    next();
  }
});

const Workout = mongoose.model('Workout', workoutSchema);
module.exports = Workout;

app.get('/check-workouts/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Count the number of workouts for the given user
    const workoutCount = await Workout.countDocuments({ username });

    // Respond with the count of workouts
    res.json({ count: workoutCount });
  } catch (error) {
    console.error('Error counting workouts:', error);
    res.status(500).json({ error: 'Error retrieving workout count.' });
  }
});



app.post('/log-workout', async (req, res) => {
  const { username, name, exercises, duration, intensity } = req.body;

  // Validate the incoming data
  if (!username || !name || !exercises || !duration || !intensity) {
    return res.status(400).json({ error: 'All fields are required: username, name, exercises, duration, intensity.' });
  }

  // Additional validation for duration and intensity
  if (duration < 0) {
    return res.status(400).json({ error: 'Duration must be greater than or equal to 0.' });
  }

  if (!['Low', 'Medium', 'High'].includes(intensity)) {
    return res.status(400).json({ error: 'Intensity must be one of: Low, Medium, High.' });
  }

  try {
    // Create a new workout entry
    const newWorkout = new Workout({
      username,
      name,
      exercises,
      duration,
      intensity,
      date: new Date(),  // Current date and time
    });

    // Save the workout to the database
    const savedWorkout = await newWorkout.save();
    return res.status(201).json({
      success: true,
      message: 'Workout logged successfully.',
      savedWorkout,
    });

  } catch (error) {
    console.error('Error logging workout:', error.message);  // logs the error message
    
    // Check if the error is a unique constraint violation (duplicate name for the user)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Workout name must be unique for each user.' });
    }

    // Generic server error response
    return res.status(500).json({ error: 'Server error while logging workout.', details: error.message });
  }
});


app.get('/get-workouts/:username', async (req, res) => {
  const { username } = req.params;  // Extract username from request

  try {
      // Fetch all workouts for the given username
      const workouts = await Workout.find({ username });

      // If no workouts are found, return an empty array
      if (workouts.length === 0) {
          return res.json([]);  // Return an empty array if no workouts exist
      }

      // Return the list of workouts as a JSON response
      return res.json(workouts);
  } catch (error) {
      console.error('Error fetching workouts:', error);
      return res.status(500).json({ error: 'Server error fetching workouts' });
  }
});

app.put('/update-workout', async (req, res) => {
  const { id, name, exercises, duration, intensity } = req.body;
  console.log(req.body); // Check incoming data for debugging

  // Validate incoming data
  if (!id || !name || !exercises || !duration || !intensity) {
    return res.status(400).json({ error: 'All fields are required: id, name, exercises, duration, intensity.' });
  }

  try {
    // Check if the workout with the same name exists for the user
    const existingWorkout = await Workout.findOne({ _id: { $ne: id }, username: req.body.username, name });
    if (existingWorkout) {
      return res.status(400).json({ error: 'A workout with this name already exists. Please choose a different name.' });
    }

    // Find and update the workout by its id
    const updatedWorkout = await Workout.findByIdAndUpdate(
      id, // Use the workout's unique ID
      { $set: { name, exercises, duration, intensity } }, // Update the workout fields
      { new: true } // Return the updated document
    );

    if (!updatedWorkout) {
      return res.status(404).json({ error: 'Workout not found.' });
    }

    res.json(updatedWorkout);
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({ error: 'Error updating workout', details: error.message });
  }
});





// Delete workout
app.delete('/delete-workout', async (req, res) => {
  const { id } = req.body; // Expecting the workout's id in the request body

  // Log incoming data for debugging
  console.log('Delete workout request received:', { id });

  // Validate the input data
  if (!id) {
    console.warn('Invalid request: Missing workout id.');
    return res.status(400).json({ error: 'Workout id is required.' });
  }

  try {
    // Attempt to delete the workout by its unique id
    const deletedWorkout = await Workout.findByIdAndDelete(id);

    // Check if the workout was found and deleted
    if (!deletedWorkout) {
      console.warn('Workout not found for deletion:', { id });
      return res.status(404).json({ error: 'Workout not found.' });
    }

    // Delete all workout statuses associated with the workout
    const deletedStatuses = await WorkoutStatus.deleteMany({ workoutId: id });
    console.log('Associated workout statuses deleted:', deletedStatuses);

    res.status(200).json({ 
      success: true, 
      message: 'Workout and associated statuses deleted successfully.' 
    });
  } catch (error) {
    // Log any errors for debugging
    console.error('Error deleting workout or associated statuses:', error);
    res.status(500).json({ error: 'Server error while deleting the workout.' });
  }
});


const workoutStatusSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true // Link to the user
  },
  workoutId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Workout', // Reference to the workout collection
    required: true // Workout ID (required)
  },
  status: { 
    type: String, 
    enum: ['No', 'Yes'], 
    required: true, // Whether the workout was completed (required)
  },
  date: { 
    type: Date, 
    required: true, 
    default: Date.now // The date when the status was recorded (defaults to current date)
  }
});

// Create the model based on the schema
const WorkoutStatus = mongoose.model('WorkoutStatus', workoutStatusSchema);

module.exports = WorkoutStatus;

// Save workout status for a user
app.post('/save-workout-status', async (req, res) => {
  const { username, updatedWorkouts } = req.body;

  try {
    // Create a new workout status entry
    const newStatus = new WorkoutStatus({
      username,
      workoutId,
      status,
      date: new Date() // Default to the current date
    });

    // Save the new status
    await newStatus.save();

    res.status(200).json({ success: true, message: 'Workout status saved successfully.' });
  } catch (error) {
    console.error('Error saving workout status:', error);
    res.status(500).json({ error: 'Error saving workout status', details: error.message });
  }
});

// Get workout statuses for a user
app.put('/update-workout-status', async (req, res) => {
  const { username, updatedWorkouts } = req.body;

  // Ensure the request body is valid
  if (!username || !updatedWorkouts || updatedWorkouts.length === 0) {
      return res.status(400).json({ error: 'Invalid data. Username and updated workouts are required.' });
  }

  try {
      // Log the incoming request data for debugging
      console.log('Updated workouts:', updatedWorkouts);

      // Loop through each updated workout status and save it
      for (let workoutStatus of updatedWorkouts) {
          const { id, status, date } = workoutStatus;

          console.log(`Processing workout: ${id}, Status: ${status}, Date: ${date}`);

          // Find the existing workout status for this user and workout
          const existingStatus = await WorkoutStatus.findOne({ username, workoutId: id, date });

          // Log whether an existing status was found
          console.log('Existing status found:', existingStatus);

          // If an existing status is found, update it, otherwise create a new status entry
          if (existingStatus) {
              existingStatus.status = status;
              await existingStatus.save();
              console.log(`Updated status for workout ${id}`);
          } else {
              // If no existing status, create a new one
              const newStatus = new WorkoutStatus({
                  username,
                  workoutId: id,
                  status,
                  date
              });

              await newStatus.save();
              console.log(`Created new status for workout ${id}`);
          }
      }

      res.status(200).json({ success: true, message: 'Workout statuses updated successfully.' });
  } catch (error) {
      console.error('Error saving workout statuses:', error);
      res.status(500).json({ error: 'Error saving workout statuses', details: error.message });
  }
});

// Get workout statuses for a specific user and date
app.get('/get-workout-statuses', async (req, res) => {
  const { username, date } = req.query; // Get username and date from query parameters

  if (!username || !date) {
    return res.status(400).json({ error: 'Username and date are required.' });
  }

  try {
    // Validate and parse the date
    const startDate = new Date(date);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
    }

    // Set endDate to the next day to include the entire day
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    // Log query parameters for debugging
    console.log(`Fetching workout statuses for username: ${username}, date range: ${startDate} - ${endDate}`);

    // Query the database for statuses that match the user and the date range
    const statuses = await WorkoutStatus.find({
      username,
      date: { $gte: startDate, $lt: endDate }, // Ensure date is within the range
    }).populate('workoutId'); // Populate the workout details

    res.status(200).json(statuses);
  } catch (error) {
    console.error('Error fetching workout statuses:', error);
    res.status(500).json({ error: 'Error fetching workout statuses', details: error.message });
  }
});

app.get('/get-workout-progress', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required' });
  }

  try {
    // Fetch all completed workouts for the user
    const completedWorkouts = await WorkoutStatus.find({
      username: username,
      status: 'Yes',
    }).sort({ date: 1 }); // Sort by date in ascending order

    if (!completedWorkouts.length) {
      return res.json({ success: true, averageWorkoutsPerWeek: 0, totalCompletedWorkouts: 0 });
    }

    // Group workouts by week
    const weeklyWorkouts = {};
    const startOfWeek = (date) => {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay()); // Set to the start of the week (Sunday)
      d.setHours(0, 0, 0, 0); // Clear time
      return d.toISOString();
    };

    for (const workout of completedWorkouts) {
      const week = startOfWeek(workout.date);
      if (!weeklyWorkouts[week]) {
        weeklyWorkouts[week] = 0;
      }
      weeklyWorkouts[week]++;
    }

    // Calculate the average workouts per week
    const totalWeeks = Object.keys(weeklyWorkouts).length;
    const totalCompletedWorkouts = completedWorkouts.length;
    const averageWorkoutsPerWeek = (totalCompletedWorkouts / totalWeeks).toFixed(2);

    return res.json({
      success: true,
      averageWorkoutsPerWeek: averageWorkoutsPerWeek,
      totalCompletedWorkouts: totalCompletedWorkouts,
      weeklyData: weeklyWorkouts,
    });
  } catch (error) {
    console.error('Error fetching average workouts per week:', error);
    return res.status(500).json({ success: false, error: 'Error fetching average workouts per week' });
  }
});





app.get('/get-workout-completions', async (req, res) => {
  const { username, period } = req.query;

  if (!username || !period) {
    return res.status(400).json({ success: false, error: 'Username and period are required' });
  }

  try {
    let dateRange;

    // Determine the date range based on the period (weekly or monthly)
    if (period === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateRange = { $gte: oneWeekAgo };
    } else if (period === 'monthly') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      dateRange = { $gte: oneMonthAgo };
    } else {
      return res.status(400).json({ success: false, error: 'Invalid period' });
    }

    // Fetch the workout status data with `status: 'Yes'` and populate the workout details
    const workoutStatuses = await WorkoutStatus.find({
      username: username,
      date: dateRange,
      status: 'Yes', // Include only workouts marked as completed (status = "Yes")
    })
      .populate('workoutId', 'name') // Populate workout name
      .exec();

    if (!workoutStatuses || workoutStatuses.length === 0) {
      return res.status(404).json({ success: false, error: 'No workout data found for the specified period' });
    }

    // Count the completions of each workout
    const workoutCounts = workoutStatuses.reduce((counts, workoutStatus) => {
      const workoutName = workoutStatus.workoutId.name; // Access the populated workout name
      if (!counts[workoutName]) {
        counts[workoutName] = 0;
      }
      counts[workoutName]++;
      return counts;
    }, {});

    // Prepare the data for the chart
    const labels = Object.keys(workoutCounts);
    const data = Object.values(workoutCounts);

    return res.json({
      success: true,
      labels: labels,
      data: data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Error fetching workout completion data' });
  }
});

