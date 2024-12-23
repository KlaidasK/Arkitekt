# Sveikatos ir fizinės būklės sekimo svetainė

## 1. Sistemos tikslas
Svetainėje vartotojai galės susikurti profilius, stebėti savo sportavimo veiklą, registruoti maistą ir stebėti savo svorio progresą laikui bėgant. Vartotojai gali nustatyti sveikatos tikslus, laikytis pagrindinių treniruočių ir mitybos planų bei peržiūrėti pažangą asmeniniame prietaisų skydelyje. Svetainėje taip pat bus pateikiami priminimai apie treniruotes, hidrataciją ir maitinimą, pritaikytas mobiliesiems ir staliniams kompiuteriams.

## 2. Funkcionalumas
Sistemos funkcijų sąrašas:

- **Pirma iteracija:** 1–2 funkcijos 
1. **Vartotojų registracija ir profilių valdymas**  
   Vartotojai gali kurti ir tvarkyti profilius, įskaitant asmeninius duomenis (amžių, svorį, ūgį) ir sveikatos tikslus.

2. **Veiklos stebėjimas**  
   Registruoti kasdienę fizinę veiklą (žingsnius, treniruotes, sudegintas kalorijas ir kt.) bei stebėti progresą laikui bėgant.

- **Antra iteracija:** 3–5 funkcijos 
3. **Mitybos registravimas**  
   Vartotojai gali įvesti ir sekti savo maistą, suvartojamų kalorijų kiekį ir maistines medžiagas (baltymus, riebalus, angliavandenius).

4. **Svorio stebėjimas**  
   Registruoti ir vizualizuoti svorio pokyčius naudojant progreso grafikus laikui bėgant.

5. **Treniruočių planai**  
   Prieiga prie iš anksto nustatytų treniruočių rutinų su galimybe registruoti baigtus pratimus.

- **Trečia iteracija:** 6–7 funkcijos 
6. **Tikslų nustatymas**  
   Vartotojai gali nustatyti sveikatos tikslus (pvz., numesti svorio, priaugti raumenų) ir stebėti savo pažangą siekiant šių tikslų.

7. **Pažangos informacijos suvestinė**  
   Suasmeninta informacijos suvestinė, skirta aktyvumui, mitybai, svoriui ir tikslo pažangai rodyti aiškiu vaizdiniu formatu (pvz., diagramomis).

- **Ketvirta iteracija:** 8–10 funkcijos
8. **Priminimai ir pranešimai**  
   Kasdieniai priminimai apie treniruotes, maistą, vandens suvartojimą ir kitą su sveikata susijusią veiklą.

9. **Ataskaitos ir analizė**  
   Kurkite išsamias savaitės ar mėnesio ataskaitas apie sveikatos pažangą, mitybą ir aktyvumo lygius.

10. **Reaktyvus dizainas**  
    Visas funkcionalumas visuose įrenginiuose, užtikrinantis sklandų naudojimą tiek staliniuose kompiuteriuose, tiek mobiliosiose platformose.


# Paleidimo instrukcija

## 1. Atidaryti aplanką, kuriame yra failas `HP.js`
- Suraskite atsiųsto projekto katalogą, kuriame yra **`HP.js`** failas.
- Jei naudojate **Windows Explorer**, naviguokite į tą aplanką, kuriame išsaugotas failas.
- Įsitikinkite, kad aplankas tikrai turi failą `HP.js`, nes būtent šis failas bus naudojamas serveriui paleisti.

## 2. Atidaryti terminalą (gali būti CMD, Windows Powershell)
- Paspauskite klavišų kombinaciją **Win + R**, įveskite **cmd** ir paspauskite **Enter** – taip atidarysite standartinį komandinės eilutės langą.
- Alternatyviai galite naudoti **Windows Powershell**: paspauskite dešinį pelės klavišą bet kuriame aplanke (kur yra `HP.js`) ir pasirinkite **"Open Powershell here"**.
- Jei naudojate **Visual Studio Code**, galite atidaryti terminalą tiesiai iš IDE (spustelėkite **„Terminal“ > „New Terminal“** arba naudokite **Ctrl + ~** spartųjį klavišą).

## 3. Pradėti serverį terminale: įrašyti terminale `nodemon HP.js`
### Kas yra `nodemon`:
- Tai yra **Node.js** įrankis, kuris automatiškai perkrauna jūsų serverį kaskart, kai padarote failo pakeitimų.
- Jei neturite `nodemon`, įdiekite jį naudodami komandą:  
  ```bash
  npm install -g nodemon
### Kaip paleisti HP.js:
- Terminale įrašykite komandą: nodemon HP.js ir paspauskite Enter.
- Jei viskas vyksta sklandžiai, terminalas turėtų parodyti pranešimą, kad serveris veikia (pvz., „Server is running on port 3019“).

## 4.	Atidaryti puslapį: localhost:3019
- **Kas yra  `localhost`:**
   - Tai nurodo jūsų vietinį kompiuterį kaip serverį, todėl nereikia interneto, kad prie jo prisijungtumėte.
- **Kaip atidaryti:**
  1. Atidarykite bet kurią naršyklę (pvz., **Chrome**, **Edge**, **Firefox**).
  2. Adreso juostoje įveskite:
     ```
     http://localhost:3019
     ```
  3. Paspauskite **Enter**.

- **Rezultatas:**
  - Jei viskas veikia teisingai, tinklalapis turėtų būti rodomas naršyklėje.

 ## 5. Galimi trikčių šalinimo žingsniai:

- **Jei komanda `nodemon HP.js` neveikia:**
  1. Patikrinkite, ar **Node.js** yra įdiegtas. Į terminalą įveskite:
     ```
     node -v
     ```
     Įsitikinkite, kad rodo **Node** versiją.
  2. Įsitikinkite, kad **nodemon** įdiegtas globaliai. Jei ne, įdiekite jį su šia komanda:
     ```
     npm install -g nodemon
     ```

- **Jei puslapis neatidaromas naršyklėje:**
  1. Patikrinkite, ar **HP.js** failas tikrai naudoja portą **3019** (ar bet kurį kitą uostą, nurodytą faile).
  2. Įsitikinkite, kad serveris terminale rodo veikimo pranešimą, pvz.,:
     ```
     Listening on port 3019
     ```

 # Kodo sudėtis

## CSS failas paimtas iš W3Schools - populiarios mokymosi svetainės, skirtos interneto programavimui.
- Kam naudojama:
   - Tai W3.CSS stilių biblioteka. Ji suteikia iš anksto paruoštų CSS klasių, skirtų greitai ir lengvai kurti atsako dizainą, komponentus, pvz., mygtukus, lenteles, korteles ir kitus elementus.
   - Naudojama tam, kad nereikėtų kurti visų stilių nuo nulio ir būtų užtikrintas patrauklus bei atsakingas dizainas.


## Failas paimtas iš cdnjs.com – turinio paskirstymo tinklo, kuris teikia prieigą prie įvairių bibliotekų, įskaitant Font Awesome.
- Kam naudojama:
   - Font Awesome yra piktogramų biblioteka, leidžianti naudoti įvairias vektorines ikonas, tokias kaip mygtukai, socialiniai tinklai, naudotojo profiliai, ar meniu elementai.
   - Pavyzdys: <i class="fas fa-user"></i> įterpia naudotojo piktogramą.


## Failas paimtas iš jsDelivr – turinio paskirstymo tinklo, kuriame yra daug JavaScript bibliotekų.
- Kam naudojama:
   - Chart.js yra JavaScript biblioteka, skirta kurti įvairius grafikus ir diagramas, tokius kaip linijų, barų, pyragų ir kitų tipų grafikai.
   - Naudojama svorio, kalorijų, treniruočių ir maistinių medžiagų vizualizavimui.
 
## Sugeneruota
- Diagramos (Svorio, kalorijų, treniruočių ir maistinių medžiagų vizualizavimui).
- Treniruočių žymėjimo langeliai (checkboxes).
- BMI diagrama.


