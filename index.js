const neo4j = require('neo4j-driver');
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'dashboard'));
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
//app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'C:Users/public')));
// Utility function to run queries
const runQuery = async (query, params = {}) => {
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records.map(record => record.get(0).properties);
  } catch (error) {
    console.error('Query error', error);
    throw error;
  } finally {
    await session.close();
  }
};
const bcrypt = require('bcrypt');
async function createUser(username, password, email) {
  const hashedPassword = await bcrypt.hash(password, 10); // Hash the password for security

  // Create a new session for database operations
  const session = driver.session();

  try {
    const result = await session.run(
      'CREATE (u:User {username: $username, hashedPassword: $hashedPassword, email: $email}) RETURN u',
      { username, hashedPassword, email }
    );
    console.log(result.records[0].get('u').properties);
  } catch (error) {
    console.error('Failed to create user', error);
  } finally {
    // Make sure to close the session when done
    await session.close();
  }
}
createUser('johnDoe', 'mySecretPassword', 'johndoe@example.com').catch(console.error);
////////LOGIN ENDPOINT/////////////
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const session = driver.session();
  try {
    const result = await session.run('MATCH (u:User {username: $username}) RETURN u', { username });
    if (result.records.length === 0) {
      res.status(401).send('User not found');
      return;
    }
    const user = result.records[0].get('u').properties;
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (isMatch) {
      res.json({ message: 'Login successful', user: username });
    } else {
      res.status(401).send('Password is incorrect');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during the login process');
  } finally {
    await session.close();
  }
});


// Register a new patient
app.post('/register', async (req, res) => {
  try {
    const patient = await runQuery(
      `CREATE (p:Patient {patientID: $patientID, birthdate: $birthdate, gender: $gender}) RETURN p`,
      req.body
    );
    res.json({ message: 'Patient registered successfully', patient });
  } catch (error) {
    res.status(500).send('Error registering patient');
  }
});

// Update patient profile
app.put('/patients/:patientID', async (req, res) => {
  try {
    const patientID = req.params.patientID;
    const { birthdate, gender } = req.body;
    const patient = await runQuery(
      `MATCH (p:Patient {patientID: $patientID})
       SET p.birthdate = $birthdate, p.gender = $gender
       RETURN p`,
      { patientID, birthdate, gender }
    );
    res.json({ message: 'Patient profile updated successfully', patient });
  } catch (error) {
    res.status(500).send('Error updating patient profile');
  }
});

// Log a new symptom for a patient
app.post('/patients/:patientID/symptoms', async (req, res) => {
  try {
    const patientID = req.params.patientID;
    const { symptomCode, description } = req.body;
    const symptom = await runQuery(
      `MATCH (p:Patient {patientID: $patientID})
       CREATE (p)-[:HAS_SYMPTOM]->(s:Symptom {symptomCode: $symptomCode, description: $description})
       RETURN s`,
      { patientID, symptomCode, description }
    );
    res.json({ message: 'Symptom logged successfully', symptom });
  } catch (error) {
    res.status(500).send('Error logging symptom');
  }
});

// Retrieve treatment plans for a patient
app.get('/patients/:patientID/treatmentPlans', async (req, res) => {
  try {
    const patientID = req.params.patientID;
    const treatmentPlans = await runQuery(
      `MATCH (p:Patient {patientID: $patientID})-[:FOLLOWS_CAREPLAN]->(cp:CarePlan)
       RETURN cp`,
      { patientID }
    );
    res.json({ treatmentPlans });
  } catch (error) {
    res.status(500).send('Error retrieving treatment plans');
  }
});

// Additional API endpoints would follow the same pattern: using `runQuery` with appropriate Cypher queries.

app.listen(3000, () => {
  console.log(`Server running at http://localhost:3000`);
});
