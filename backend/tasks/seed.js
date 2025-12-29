import {
  users,
  projects,
  applications,
  updates,
  posts,
  postLikes,
  postComments,
} from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import dotenv from "dotenv";

dotenv.config();

const professors = [
  {
    _id: { $oid: "000000000000000000000001" },
    clerkId: "seed_clerk_professor_001",
    firstName: "Alice",
    lastName: "Smith",
    email: "asmith@stevens.edu",
    role: "PROFESSOR",
    department: "COMPUTER_SCIENCE",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000002" },
    firstName: "Bob",
    lastName: "Johnson",
    email: "bjohnson@stevens.edu",
    role: "PROFESSOR",
    department: "ELECTRICAL_AND_COMPUTER_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000003" },
    firstName: "Cathy",
    lastName: "Williams",
    email: "cwilliams@stevens.edu",
    role: "PROFESSOR",
    department: "MATHEMATICAL_SCIENCES",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000004" },
    firstName: "David",
    lastName: "Brown",
    email: "dbrown@stevens.edu",
    role: "PROFESSOR",
    department: "MECHANICAL_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000005" },
    firstName: "Eve",
    lastName: "Jones",
    email: "ejones@stevens.edu",
    role: "PROFESSOR",
    department: "BIOMEDICAL_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000006" },
    firstName: "Frank",
    lastName: "Garcia",
    email: "fgarcia@stevens.edu",
    role: "PROFESSOR",
    department: "CHEMISTRY_AND_CHEMICAL_BIOLOGY",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000007" },
    firstName: "Grace",
    lastName: "Martinez",
    email: "gmartinez@stevens.edu",
    role: "PROFESSOR",
    department: "PHYSICS",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000008" },
    firstName: "Henry",
    lastName: "Lee",
    email: "hlee@stevens.edu",
    role: "PROFESSOR",
    department: "SYSTEMS_AND_ENTERPRISES",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000009" },
    firstName: "Ivy",
    lastName: "Taylor",
    email: "itaylor@stevens.edu",
    role: "PROFESSOR",
    department: "CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000010" },
    firstName: "Jack",
    lastName: "Harris",
    email: "jharris@stevens.edu",
    role: "PROFESSOR",
    department: "CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000011" },
    firstName: "Karen",
    lastName: "White",
    email: "kwhite@stevens.edu",
    role: "PROFESSOR",
    department: "COMPUTER_SCIENCE",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000012" },
    firstName: "Leo",
    lastName: "King",
    email: "lking@stevens.edu",
    role: "PROFESSOR",
    department: "ELECTRICAL_AND_COMPUTER_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000013" },
    firstName: "Mia",
    lastName: "Scott",
    email: "mscott@stevens.edu",
    role: "PROFESSOR",
    department: "MATHEMATICAL_SCIENCES",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000014" },
    firstName: "Nina",
    lastName: "Moore",
    email: "nmoore@stevens.edu",
    role: "PROFESSOR",
    department: "MECHANICAL_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000015" },
    firstName: "Owen",
    lastName: "Clark",
    email: "oclark@stevens.edu",
    role: "PROFESSOR",
    department: "BIOMEDICAL_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000016" },
    firstName: "Paula",
    lastName: "Hall",
    email: "phall@stevens.edu",
    role: "PROFESSOR",
    department: "CHEMISTRY_AND_CHEMICAL_BIOLOGY",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000017" },
    firstName: "Quinn",
    lastName: "Adams",
    email: "qadams@stevens.edu",
    role: "PROFESSOR",
    department: "PHYSICS",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000018" },
    firstName: "Ryan",
    lastName: "Baker",
    email: "rbaker@stevens.edu",
    role: "PROFESSOR",
    department: "SYSTEMS_AND_ENTERPRISES",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000019" },
    firstName: "Sophia",
    lastName: "Carter",
    email: "scarter@stevens.edu",
    role: "PROFESSOR",
    department: "CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE",
    bio: null,
  },
  {
    _id: { $oid: "000000000000000000000020" },
    firstName: "Tyler",
    lastName: "Evans",
    email: "tevans@stevens.edu",
    role: "PROFESSOR",
    department: "CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING",
    bio: null,
  },
];

const projectsSeed = [
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7dab" },
    title: "AI-Powered Drug Discovery",
    createdDate: "2024-12-16T22:11:49.301Z",
    description: `
      <h2>Project Overview</h2>
      <p>This project utilizes <strong>artificial intelligence</strong> and machine learning to revolutionize the drug discovery process.</p>
      <h3>Key Features</h3>
      <ul>
        <li>Analysis of large datasets of chemical compounds, biological interactions, and clinical trials.</li>
        <li>Predictive analytics for identifying potential drug candidates.</li>
        <li>Natural Language Processing for understanding research papers.</li>
        <li>Computer vision techniques for studying molecular structures.</li>
      </ul>
      <h3>Expected Outcomes</h3>
      <p>Reduced time and cost of bringing new drugs to market while ensuring precision and safety in treatments.</p>
    `,
    department: "BIOMEDICAL_ENGINEERING",
    professors: ["000000000000000000000001"],
    students: [],
  },
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7dac" },
    title: "Renewable Energy Optimization",
    createdDate: "2024-12-16T22:15:49.301Z",
    description: `
      <h2>Project Focus</h2>
      <p>Optimizing renewable energy systems, particularly wind and solar power.</p>
      <h3>Key Objectives</h3>
      <ul>
        <li>Design algorithms for <strong>dynamic energy management</strong>.</li>
        <li>Develop predictive maintenance systems for renewable energy farms.</li>
        <li>Integrate IoT-enabled devices for real-time data collection.</li>
        <li>Create machine learning models to forecast energy output based on weather patterns.</li>
      </ul>
      <h3>Goal</h3>
      <p>Maximize energy efficiency and support sustainable power generation.</p>
    `,
    department: "CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE",
    professors: ["000000000000000000000002"],
    students: [],
  },
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7dad" },
    title: "Quantum Computing for Cryptography",
    createdDate: "2024-12-16T22:20:49.301Z",
    description: `
      <h2>Project Scope</h2>
      <p>Utilize <strong>quantum computing</strong> for creating robust cryptographic protocols.</p>
      <h3>Research Areas</h3>
      <ul>
        <li>Implementing quantum algorithms like Shor's and Grover's.</li>
        <li>Developing encryption methods resistant to classical and quantum attacks.</li>
        <li>Exploring post-quantum cryptography solutions for future-proof security.</li>
      </ul>
      <h3>Impact</h3>
      <p>Ensure data security in a quantum computing era.</p>
    `,
    department: "CHEMISTRY_AND_CHEMICAL_BIOLOGY",
    professors: ["000000000000000000000003"],
    students: [],
  },
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7dae" },
    title: "Smart City Infrastructure",
    createdDate: "2024-12-16T22:25:49.301Z",
    description: `
      <h2>Objective</h2>
      <p>Develop a framework for <strong>smart city infrastructure</strong> using IoT and predictive analytics.</p>
      <h3>Main Components</h3>
      <ul>
        <li>IoT-based systems for monitoring utilities, traffic, and waste management.</li>
        <li>Predictive analytics for optimizing resource allocation.</li>
        <li>Citizen engagement through mobile apps and real-time dashboards.</li>
      </ul>
      <h3>Goal</h3>
      <p>Enhance urban sustainability and resource management.</p>
    `,
    department: "MATHEMATICAL_SCIENCES",
    professors: ["000000000000000000000004"],
    students: [],
  },
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7daf" },
    title: "Advanced Robotics for Healthcare",
    createdDate: "2024-12-16T22:30:49.301Z",
    description: `
      <h2>Overview</h2>
      <p>Exploring the application of <strong>advanced robotics</strong> in healthcare for surgical assistance and rehabilitation.</p>
      <h3>Features</h3>
      <ul>
        <li>Develop autonomous robotic systems for minimally invasive surgeries.</li>
        <li>Create assistive robots for patient mobility and recovery.</li>
        <li>Incorporate AI for real-time decision-making.</li>
      </ul>
      <h3>Outcome</h3>
      <p>Improved precision and efficiency in healthcare delivery.</p>
    `,
    department: "MECHANICAL_ENGINEERING",
    professors: ["000000000000000000000005"],
    students: [],
  },
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7db0" },
    title: "Blockchain for Supply Chain Management",
    createdDate: "2024-12-16T22:35:49.301Z",
    description: `
      <h2>Project Goal</h2>
      <p>Enhance supply chain transparency and security using <strong>blockchain technology</strong>.</p>
      <h3>Key Components</h3>
      <ul>
        <li>Develop decentralized applications (dApps) for tracking goods.</li>
        <li>Implement smart contracts to automate transactions.</li>
        <li>Integrate IoT devices for real-time data collection.</li>
      </ul>
      <h3>Objective</h3>
      <p>Ensure seamless traceability and efficiency in supply chains.</p>
    `,
    department: "SYSTEMS_AND_ENTERPRISES",
    professors: ["000000000000000000000006"],
    students: [],
  },
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7db1" },
    title: "Augmented Reality for Education",
    createdDate: "2024-12-16T22:40:49.301Z",
    description: `
      <h2>Focus</h2>
      <p>Leverage <strong>augmented reality (AR)</strong> to enhance educational experiences.</p>
      <h3>Key Features</h3>
      <ul>
        <li>Develop immersive AR tools for interactive STEM learning.</li>
        <li>Create real-time feedback systems for adaptive learning paths.</li>
        <li>Personalize learning experiences to improve outcomes.</li>
      </ul>
      <h3>Goal</h3>
      <p>Transform traditional education through innovative AR technologies.</p>
    `,
    department: "BIOMEDICAL_ENGINEERING",
    professors: ["000000000000000000000007"],
    students: [],
  },
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7db2" },
    title: "AI-Driven Wildlife Conservation",
    createdDate: "2024-12-16T22:45:49.301Z",
    description: `
      <h2>Objective</h2>
      <p>Utilize AI to support <strong>wildlife conservation</strong> efforts.</p>
      <h3>Focus Areas</h3>
      <ul>
        <li>Develop computer vision algorithms for monitoring animal populations.</li>
        <li>Detect poaching activities using drone-captured imagery.</li>
        <li>Create predictive models for migration patterns and habitat changes.</li>
      </ul>
      <h3>Outcome</h3>
      <p>Provide actionable insights for effective conservation planning.</p>
    `,
    department: "BIOMEDICAL_ENGINEERING",
    professors: ["000000000000000000000008"],
    students: [],
  },
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7db3" },
    title: "Cybersecurity in IoT Networks",
    createdDate: "2024-12-16T22:50:49.301Z",
    description: `
      <h2>Focus</h2>
      <p>Address the challenges of <strong>cybersecurity</strong> in IoT networks.</p>
      <h3>Key Features</h3>
      <ul>
        <li>Develop robust encryption techniques for IoT devices.</li>
        <li>Create intrusion detection systems tailored for IoT networks.</li>
        <li>Design vulnerability assessment tools to mitigate risks.</li>
      </ul>
      <h3>Impact</h3>
      <p>Establish trust and security in IoT-based applications.</p>
    `,
    department: "ELECTRICAL_AND_COMPUTER_ENGINEERING",
    professors: ["000000000000000000000009"],
    students: [],
  },
  {
    _id: { $oid: "6760a5a56a057dfdb2ff7db4" },
    title: "Next-Generation Bioinformatics Tools",
    createdDate: "2024-12-16T22:55:49.301Z",
    description: `
      <h2>Goal</h2>
      <p>Create advanced <strong>bioinformatics tools</strong> for genomic and proteomic analysis.</p>
      <h3>Features</h3>
      <ul>
        <li>Integrate AI-driven analytics to identify biomarkers.</li>
        <li>Analyze genetic patterns for personalized medicine.</li>
        <li>Develop visualization tools for complex biological data.</li>
      </ul>
      <h3>Impact</h3>
      <p>Support precision healthcare through cutting-edge bioinformatics technologies.</p>
    `,
    department: "ELECTRICAL_AND_COMPUTER_ENGINEERING",
    professors: ["000000000000000000000010"],
    students: [],
  },
];

const seedUsers = async () => {
  const userCollection = await users();

  for (let professor of professors) {
    professor._id = new ObjectId(professor._id.$oid);

    try {
      // Insert the professor directly into the database
      await userCollection.updateOne(
        { _id: professor._id }, // Ensure upsert is based on _id
        { $set: professor },
        { upsert: true } // Insert if not already present
      );
      console.log(`Inserted/updated professor: ${professor.email}`);
    } catch (err) {
      console.error(`Error inserting/updating professor in database: ${err.message}`);
      throw err; // Stop further execution if there's an error inserting the professor
    }
  }
};

const students = [
  {
    _id: { $oid: "100000000000000000000001" },
    firstName: "John",
    lastName: "Doe",
    email: "jdoe@stevens.edu",
    role: "STUDENT",
    department: "COMPUTER_SCIENCE",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000002" },
    firstName: "Emma",
    lastName: "Watson",
    email: "ewatson@stevens.edu",
    role: "STUDENT",
    department: "ELECTRICAL_AND_COMPUTER_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000003" },
    firstName: "Liam",
    lastName: "Johnson",
    email: "ljohnson@stevens.edu",
    role: "STUDENT",
    department: "MECHANICAL_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000004" },
    firstName: "Sophia",
    lastName: "Brown",
    email: "sbrown@stevens.edu",
    role: "STUDENT",
    department: "BIOMEDICAL_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000005" },
    firstName: "Noah",
    lastName: "Williams",
    email: "nwilliams@stevens.edu",
    role: "STUDENT",
    department: "CHEMISTRY_AND_CHEMICAL_BIOLOGY",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000006" },
    firstName: "Ava",
    lastName: "Davis",
    email: "adavis@stevens.edu",
    role: "STUDENT",
    department: "PHYSICS",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000007" },
    firstName: "Ethan",
    lastName: "Miller",
    email: "emiller@stevens.edu",
    role: "STUDENT",
    department: "SYSTEMS_AND_ENTERPRISES",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000008" },
    firstName: "Isabella",
    lastName: "Garcia",
    email: "igarcia@stevens.edu",
    role: "STUDENT",
    department: "MATHEMATICAL_SCIENCES",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000009" },
    firstName: "Mason",
    lastName: "Martinez",
    email: "mmartinez@stevens.edu",
    role: "STUDENT",
    department: "CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000010" },
    firstName: "Olivia",
    lastName: "Hernandez",
    email: "ohernandez@stevens.edu",
    role: "STUDENT",
    department: "CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000011" },
    firstName: "Lucas",
    lastName: "Moore",
    email: "lmoore@stevens.edu",
    role: "STUDENT",
    department: "MECHANICAL_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000012" },
    firstName: "Charlotte",
    lastName: "Taylor",
    email: "ctaylor@stevens.edu",
    role: "STUDENT",
    department: "COMPUTER_SCIENCE",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000013" },
    firstName: "Benjamin",
    lastName: "Anderson",
    email: "banderson@stevens.edu",
    role: "STUDENT",
    department: "ELECTRICAL_AND_COMPUTER_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000014" },
    firstName: "Mia",
    lastName: "Thomas",
    email: "mthomas@stevens.edu",
    role: "STUDENT",
    department: "PHYSICS",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000015" },
    firstName: "Alexander",
    lastName: "Jackson",
    email: "ajackson@stevens.edu",
    role: "STUDENT",
    department: "CHEMISTRY_AND_CHEMICAL_BIOLOGY",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000016" },
    firstName: "Ella",
    lastName: "White",
    email: "ewhite@stevens.edu",
    role: "STUDENT",
    department: "MATHEMATICAL_SCIENCES",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000017" },
    firstName: "Daniel",
    lastName: "Harris",
    email: "dharris@stevens.edu",
    role: "STUDENT",
    department: "BIOMEDICAL_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000018" },
    firstName: "Scarlett",
    lastName: "Clark",
    email: "sclark@stevens.edu",
    role: "STUDENT",
    department: "SYSTEMS_AND_ENTERPRISES",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000019" },
    firstName: "James",
    lastName: "Lopez",
    email: "jlopez@stevens.edu",
    role: "STUDENT",
    department: "CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING",
    bio: null,
  },
  {
    _id: { $oid: "100000000000000000000020" },
    firstName: "Harper",
    lastName: "Hill",
    email: "hhill@stevens.edu",
    role: "STUDENT",
    department: "CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE",
    bio: null,
  },
];

const seedStudents = async () => {
  const userCollection = await users();

  for (let student of students) {
    // Ensure _id is properly formatted as an ObjectId
    student._id = new ObjectId(student._id.$oid);

    try {
      // Insert the student directly into the database
      await userCollection.updateOne(
        { _id: student._id }, // Ensure upsert is based on _id
        { $set: student },
        { upsert: true } // Insert if not already present
      );
      console.log(`Inserted/updated student: ${student.email}`);
    } catch (err) {
      console.error(
        `Error inserting/updating student in database: ${err.message}`
      );
      throw err; // Stop further execution if there's an error inserting the student
    }
  }

  console.log("All students seeded successfully");
};

//   console.log(professors);
//   await userCollection.insertMany(professors);
//   console.log("Professors added successfully");
//   closeConnection();
// };

// seedUsers();
// console.log(professors.length);

const seedProjects = async () => {
  for (let project of projectsSeed) {
    project._id = new ObjectId();
  }
  const db = await dbConnection();
  await db.dropCollection("projects");
  const projectCollection = await projects();
  await projectCollection.insertMany(projectsSeed);
  console.log("Projects added successfully");
};

// seedProjects();

const applicationsList = JSON.parse(`[
    {
      "_id": "6761d5f3b77a090274003324",
      "applicantId": "6761d1dab77a0902740032f1",
      "projectId": "6761d45bb77a09027400330b",
      "applicationDate": "2024-12-17T19:50:11.968Z",
      "lastUpdatedDate": "2024-12-17T19:50:11.968Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d5f4b77a090274003325",
      "applicantId": "6761d265b77a0902740032f2",
      "projectId": "6761d4cab77a09027400331c",
      "applicationDate": "2024-12-17T19:50:12.004Z",
      "lastUpdatedDate": "2024-12-17T19:50:12.004Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d5f4b77a090274003326",
      "applicantId": "6761d19e16b463e457017144",
      "projectId": "6761d45bb77a09027400330c",
      "applicationDate": "2024-12-17T19:50:12.011Z",
      "lastUpdatedDate": "2024-12-17T19:50:12.011Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d5f4b77a090274003327",
      "applicantId": "6761d38fb77a0902740032fd",
      "projectId": "6761d4cab77a09027400331a",
      "applicationDate": "2024-12-17T19:50:12.018Z",
      "lastUpdatedDate": "2024-12-17T19:50:12.018Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d5f4b77a090274003328",
      "applicantId": "6761d19f16b463e457017145",
      "projectId": "6761d4cab77a090274003316",
      "applicationDate": "2024-12-17T19:50:12.022Z",
      "lastUpdatedDate": "2024-12-17T19:50:12.023Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d5f4b77a090274003329",
      "applicantId": "6761d266b77a0902740032f4",
      "projectId": "6761d563b77a090274003321",
      "applicationDate": "2024-12-17T19:50:12.029Z",
      "lastUpdatedDate": "2024-12-17T19:50:12.029Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d5f4b77a09027400332a",
      "applicantId": "6761d19f16b463e457017146",
      "projectId": "6761d45bb77a09027400330f",
      "applicationDate": "2024-12-17T19:50:12.034Z",
      "lastUpdatedDate": "2024-12-17T19:50:12.034Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d5f4b77a09027400332b",
      "applicantId": "6761d267b77a0902740032f5",
      "projectId": "6761d4cab77a090274003318",
      "applicationDate": "2024-12-17T19:50:12.038Z",
      "lastUpdatedDate": "2024-12-17T19:50:12.038Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d5f4b77a09027400332c",
      "applicantId": "6761d1a016b463e457017147",
      "projectId": "6761d45bb77a09027400330e",
      "applicationDate": "2024-12-17T19:50:12.044Z",
      "lastUpdatedDate": "2024-12-17T19:50:12.044Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d5f4b77a09027400332d",
      "applicantId": "6761d267b77a0902740032f6",
      "projectId": "6761d4cab77a09027400331d",
      "applicationDate": "2024-12-17T19:50:12.050Z",
      "lastUpdatedDate": "2024-12-17T19:50:12.050Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d65fb77a09027400332e",
      "applicantId": "6761d38eb77a0902740032fc",
      "projectId": "6761d45bb77a09027400330b",
      "applicationDate": "2024-12-17T19:51:59.318Z",
      "lastUpdatedDate": "2024-12-17T19:51:59.318Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d65fb77a09027400332f",
      "applicantId": "6761d38fb77a0902740032fd",
      "projectId": "6761d45bb77a09027400330c",
      "applicationDate": "2024-12-17T19:51:59.323Z",
      "lastUpdatedDate": "2024-12-17T19:51:59.323Z",
      "status": "PENDING"
    },
    {
      "_id":"6761d65fb77a090274003330",
      "applicantId": "6761d19f16b463e457017145",
      "projectId": "6761d563b77a090274003321",
      "applicationDate": "2024-12-17T19:51:59.330Z",
      "lastUpdatedDate": "2024-12-17T19:51:59.330Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d65fb77a090274003331"
      ,
      "applicantId": "6761d266b77a0902740032f4",
      "projectId": "6761d4cab77a090274003316",
      "applicationDate": "2024-12-17T19:51:59.334Z",
      "lastUpdatedDate": "2024-12-17T19:51:59.334Z",
      "status": "PENDING"
    },
    {
      "_id": "6761d65fb77a090274003332"
      ,
      "applicantId": "6761d1a016b463e457017147",
      "projectId": "6761d4cab77a09027400331d",
      "applicationDate": "2024-12-17T19:51:59.337Z",
      "lastUpdatedDate": "2024-12-17T19:51:59.337Z",
      "status": "PENDING"
    }
  ]`);

// // console.log(applications);

const seedApplications = async () => {
  const applicationCollection = await applications();
  const usersCollection = await users();
  const projectsCollection = await projects();
  const students = await usersCollection
    .find({
      role: "STUDENT",
    })
    .toArray();
  const projectList = await projectsCollection.find().toArray();

  for (let application of applicationsList) {
    application._id = new ObjectId(application._id);
    const randomStudent = students[Math.floor(Math.random() * students.length)];
    const randomProject =
      projectList[Math.floor(Math.random() * projectList.length)];
    application.applicantId = randomStudent._id.toString();
    application.projectId = randomProject._id.toString();
    application.applicationDate = new Date().toISOString();
    application.lastUpdatedDate = new Date().toISOString();
    application.status = "PENDING";
  }
  await applicationCollection.insertMany(applicationsList);
  console.log(applicationsList);
  console.log("Applications added successfully");
};

// seedApplications();

// # region Updates
// const updatesList = [
//   {
//     _id: "6761d82cb77a09027400333a",
//     posterUserId: "6761d1dab77a0902740032f1",
//     projectId: "6761d45bb77a09027400330b",
//     subject: "CALL_FOR_APPLICANTS",
//     content:
//       "We are looking for team members to join our AI-powered code review project.",
//     postedDate: "2024-12-17T19:59:40.601Z",
//   },
//   {
//     _id: "6761d82cb77a09027400333b",
//     posterUserId: "6761d2aab77a0902740032f7",
//     projectId: "6761d45bb77a09027400330b",
//     subject: "TEAM_UPDATE",
//     content: "We have added two new team members to the project team.",
//     postedDate: "2024-12-17T19:59:40.624Z",
//   },
//   {
//     _id: "6761d82cb77a09027400333c",
//     posterUserId: "6761d38fb77a0902740032fd",
//     projectId: "6761d45bb77a09027400330c",
//     subject: "PROJECT_LAUNCH",
//     content: "Our robotics design project has officially kicked off!",
//     postedDate: "2024-12-17T19:59:40.627Z",
//   },
//   {
//     _id: "6761d82cb77a09027400333d",
//     posterUserId: "6761d393b77a090274003302",
//     projectId: "6761d45bb77a09027400330c",
//     subject: "MILESTONE_REACHED",
//     content: "We successfully tested the first robotic prototype.",
//     postedDate: "2024-12-17T19:59:40.630Z",
//   },
//   {
//     _id: "6761d82cb77a09027400333e",
//     posterUserId: "6761d266b77a0902740032f4",
//     projectId: "6761d45bb77a09027400330d",
//     subject: "PROGRESS_REPORT",
//     content:
//       "Our team has completed the circuit design for the energy grid project.",
//     postedDate: "2024-12-17T19:59:40.634Z",
//   },
//   {
//     _id: "6761d82cb77a09027400333f",
//     posterUserId: "6761d393b77a090274003303",
//     projectId: "6761d45bb77a09027400330d",
//     subject: "DEADLINE_UPDATE",
//     content:
//       "The final presentation deadline has been pushed back by one week.",
//     postedDate: "2024-12-17T19:59:40.639Z",
//   },
//   {
//     _id: "6761d82cb77a090274003340",
//     posterUserId: "6761d19f16b463e457017146",
//     projectId: "6761d45bb77a09027400330f",
//     subject: "REQUEST_FOR_FEEDBACK",
//     content: "We need input on our latest design for the prosthetics project.",
//     postedDate: "2024-12-17T19:59:40.644Z",
//   },
//   {
//     _id: "6761d82cb77a090274003341",
//     posterUserId: "6761d394b77a090274003304",
//     projectId: "6761d45bb77a09027400330f",
//     subject: "FUNDING_UPDATE",
//     content:
//       "We received new grant funding to advance the prosthetics project.",
//     postedDate: "2024-12-17T19:59:40.648Z",
//   },
//   {
//     _id: "6761d82cb77a090274003342",
//     posterUserId: "6761d267b77a0902740032f6",
//     projectId: "6761d4cab77a09027400331d",
//     subject: "EVENT_ANNOUNCEMENT",
//     content: "Join us for a seminar on sustainable water management.",
//     postedDate: "2024-12-17T19:59:40.651Z",
//   },
//   {
//     _id: "6761d82cb77a090274003343",
//     posterUserId: "6761d395b77a090274003305",
//     projectId: "6761d4cab77a09027400331d",
//     subject: "ISSUE_REPORTED",
//     content: "We've encountered delays due to water flow simulation issues.",
//     postedDate: "2024-12-17T19:59:40.656Z",
//   },
//   {
//     _id: "6761d82cb77a090274003344",
//     posterUserId: "6761d38eb77a0902740032fc",
//     projectId: "6761d45bb77a09027400330b",
//     subject: "PUBLISHED_ANNOUNCEMENT",
//     content: "Our paper on AI code review was published in a leading journal.",
//     postedDate: "2024-12-17T19:59:40.660Z",
//   },
//   {
//     _id: "6761d82cb77a090274003345",
//     posterUserId: "6761d392b77a090274003301",
//     projectId: "6761d45bb77a09027400330b",
//     subject: "FINAL_RESULTS",
//     content: "We successfully demonstrated the AI-powered code review tool.",
//     postedDate: "2024-12-17T19:59:40.663Z",
//   },
//   {
//     _id: "6761d82cb77a090274003346",
//     posterUserId: "6761d1a016b463e457017147",
//     projectId: "6761d4cab77a09027400331d",
//     subject: "PROJECT_COMPLETION",
//     content: "The sustainable water management project has been completed.",
//     postedDate: "2024-12-17T19:59:40.666Z",
//   },
//   {
//     _id: "6761d82cb77a090274003347",
//     posterUserId: "6761d395b77a090274003305",
//     projectId: "6761d45bb77a09027400330f",
//     subject: "TEAM_UPDATE",
//     content: "We have expanded the team with two new researchers.",
//     postedDate: "2024-12-17T19:59:40.670Z",
//   },
//   {
//     _id: "6761d82cb77a090274003348",
//     posterUserId: "6761d19f16b463e457017145",
//     projectId: "6761d563b77a090274003321",
//     subject: "PROGRESS_REPORT",
//     content: "We've completed phase 1 of the smart grid integration project.",
//     postedDate: "2024-12-17T19:59:40.674Z",
//   },
//   {
//     _id: "6761d867b77a090274003349",
//     posterUserId: "6761d2aab77a0902740032f7",
//     projectId: "6761d45bb77a09027400330b",
//     subject: "FUNDING_UPDATE",
//     content:
//       "We secured additional funding to enhance the AI-powered code review system.",
//     postedDate: "2024-12-17T20:00:39.577Z",
//   },
//   {
//     _id: "6761d867b77a09027400334a",
//     posterUserId: "6761d393b77a090274003302",
//     projectId: "6761d45bb77a09027400330c",
//     subject: "CALL_FOR_APPLICANTS",
//     content:
//       "We are looking for skilled contributors to join the robotics design team.",
//     postedDate: "2024-12-17T20:00:39.661Z",
//   },
//   {
//     _id: "6761d867b77a09027400334b",
//     posterUserId: "6761d267b77a0902740032f6",
//     projectId: "6761d4cab77a09027400331d",
//     subject: "DEADLINE_UPDATE",
//     content:
//       "The team has extended the submission deadline for the water management project.",
//     postedDate: "2024-12-17T20:00:39.667Z",
//   },
//   {
//     _id: "6761d867b77a09027400334c",
//     posterUserId: "6761d2acb77a0902740032fa",
//     projectId: "6761d45bb77a09027400330f",
//     subject: "MILESTONE_REACHED",
//     content:
//       "The team successfully completed the first prototype for the prosthetic limb.",
//     postedDate: "2024-12-17T20:00:39.671Z",
//   },
//   {
//     _id: "6761d867b77a09027400334d",
//     posterUserId: "6761d1dab77a0902740032f1",
//     projectId: "6761d45bb77a09027400330b",
//     subject: "EVENT_ANNOUNCEMENT",
//     content:
//       "Join us for a webinar showcasing the AI-powered code review system.",
//     postedDate: "2024-12-17T20:00:39.676Z",
//   },
// ];

// const seedUpdates = async () => {
//   const db = await dbConnection();
//   await db.dropCollection("updates");
//   const userCollection = await users();
//   const projectCollection = await projects();
//   const allUsers = await userCollection.find().toArray();
//   const allProjects = await projectCollection.find().toArray();
//   for (let update of updatesList) {
//     update._id = new ObjectId(update._id);
//     const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
//     const randomProject =
//       allProjects[Math.floor(Math.random() * allProjects.length)];
//     update.posterUserId = randomUser._id.toString();
//     update.projectId = randomProject._id.toString();
//     update.postedDate = new Date();
//   }
//   const updateCollection = await updates();
//   // await updateCollection.insertMany(updates);
//   console.log(updatesList);
//   console.log("Updates added successfully");
//   closeConnection();
// };

// seedUpdates();
//#endregion

// HOME FEED V2 SEED DATA
// Realistic Stevens research-themed posts

const seedPosts = async () => {
  console.log("Seeding posts...");
  const postCollection = await posts();
  const postLikesCol = await postLikes();
  const postCommentsCol = await postComments();
  const userCollection = await users();

  const allUsers = await userCollection.find().toArray();
  const professorUsers = allUsers.filter(u => u.role === "PROFESSOR");
  const studentUsers = allUsers.filter(u => u.role === "STUDENT");

  if (professorUsers.length === 0 || studentUsers.length === 0) {
    console.log("No users found. Skipping post seeding.");
    return;
  }

  // Helper to get random user
  const randomUser = (users) => users[Math.floor(Math.random() * users.length)];

  // Helper to get multiple random users
  const randomUsers = (users, count) => {
    const shuffled = [...users].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, users.length));
  };

  // Create posts with varying ages
  const now = new Date();
  const hoursAgo = (hours) => new Date(now - hours * 60 * 60 * 1000).toISOString();
  const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

  const postsData = [
    {
      userId: professorUsers[0]._id.toString(),
      text: "Excited to announce our breakthrough in AI-driven cybersecurity! Our team at Stevens has developed a novel machine learning model that detects zero-day threats with 94% accuracy. This research could revolutionize how we protect critical infrastructure. Looking for graduate students interested in cybersecurity and deep learning to join the project. #AI #Cybersecurity #Research",
      media: [],
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: professorUsers[1]._id.toString(),
      text: "Incredible day at the lab! Our quantum computing team just successfully demonstrated a 50-qubit quantum processor operating at room temperature. This is a major step toward practical quantum computers. Publication coming soon in Nature Physics. Special thanks to the brilliant grad students who made this possible!",
      media: [
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800", alt: "Quantum computing lab setup" },
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", alt: "Quantum processor close-up" }
      ],
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: studentUsers[0]._id.toString(),
      text: "Just defended my PhD thesis on \"Neural Interfaces for Assistive Robotics\" at Stevens! 🎓 Couldn't have done it without my advisor Dr. Williams and the amazing biomedical engineering community here. Now onto postdoc opportunities in BCI research. Thank you all for the support over these 4 years!",
      media: [
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800", alt: "Thesis defense presentation" }
      ],
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(8),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: professorUsers[2]._id.toString(),
      text: "Our robotics lab's latest autonomous underwater vehicle (AUV) completed a 72-hour ocean mapping mission! The vehicle successfully mapped 50 square kilometers of the Hudson Canyon using advanced SLAM algorithms and collected crucial environmental data. This technology will help monitor marine ecosystems and detect underwater infrastructure damage.",
      media: [
        { type: "VIDEO", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800", alt: "AUV deployment video" }
      ],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: professorUsers[3]._id.toString(),
      text: "Thrilled to share that our team's paper on sustainable energy storage systems has been accepted to the IEEE Transactions on Energy! We developed a new graphene-based supercapacitor that stores 3x more energy than current technologies. This could be game-changing for electric vehicles and renewable energy grid storage. Preprint available on arXiv.",
      media: [],
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: studentUsers[1]._id.toString(),
      text: "Won 1st place at the Stevens Innovation Expo for our AI-powered medical diagnosis app! Our team built a mobile app that uses computer vision to detect skin cancer from smartphone photos with 89% accuracy. Thanks to our faculty mentors and the entrepreneurship program for supporting us. Now looking for funding to bring this to market.",
      media: [
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800", alt: "Innovation Expo award ceremony" },
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800", alt: "Mobile app demo screenshot" },
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800", alt: "Team photo at expo" }
      ],
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: professorUsers[4]._id.toString(),
      text: "Congratulations to our graduate researchers who published in Science Robotics! The paper presents a soft robotic gripper inspired by octopus tentacles that can handle delicate objects 10x better than rigid grippers. Potential applications in agriculture, food handling, and surgery. Proud of this interdisciplinary collaboration between mechanical engineering, materials science, and biology.",
      media: [
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=800", alt: "Soft robotic gripper prototype" },
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800", alt: "Lab research setup" },
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800", alt: "Data analysis graphs" },
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800", alt: "Research team collaboration" }
      ],
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: professorUsers[5]._id.toString(),
      text: "Exciting news: Stevens receives $2.5M NSF grant for climate change research! Our interdisciplinary team will develop advanced sensors and ML models to predict coastal flooding and sea-level rise in NYC metropolitan area. This 4-year project will directly help communities prepare for climate impacts. We're hiring 3 PhD students and 2 postdocs - applications open now!",
      media: [],
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: studentUsers[2]._id.toString(),
      text: "Had an amazing experience at the NeurIPS conference presenting our work on reinforcement learning for autonomous drones. Got great feedback from researchers at MIT, Stanford, and DeepMind. Also attended fascinating workshops on LLMs and multi-agent systems. Feeling inspired to push our research further!",
      media: [
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800", alt: "Conference poster presentation" }
      ],
      createdAt: daysAgo(6),
      updatedAt: daysAgo(6),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: professorUsers[6]._id.toString(),
      text: "Our materials science lab achieved a major milestone: we synthesized a new polymer that's stronger than Kevlar but biodegradable! This could revolutionize sustainable manufacturing and reduce plastic waste. The material maintains 95% strength after 6 months of decomposition. Patent pending, paper submitted to Nature Materials.",
      media: [
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800", alt: "New polymer sample testing" },
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800", alt: "Lab equipment and materials" }
      ],
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: studentUsers[3]._id.toString(),
      text: "My summer internship at NASA JPL was incredible! Worked on Mars rover path planning algorithms using graph neural networks. Learned so much from the team and got to see the mission control center. Stevens prepared me well for this opportunity. Now applying these experiences to my thesis research.",
      media: [
        { type: "IMAGE", url: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800", alt: "NASA JPL visitor badge and mission patch" }
      ],
      createdAt: daysAgo(8),
      updatedAt: daysAgo(8),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: professorUsers[7]._id.toString(),
      text: "Reminder: Applications for our Summer 2025 Research Program are now open! We have 15 funded positions across AI, cybersecurity, biomedical engineering, robotics, and clean energy. Undergraduate and graduate students welcome. Deadline: March 1st. This is a great opportunity to work on cutting-edge research and build your CV. Apply through the Stevens research portal!",
      media: [],
      createdAt: daysAgo(9),
      updatedAt: daysAgo(9),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: professorUsers[8]._id.toString(),
      text: "Just published a comprehensive review paper on brain-computer interfaces in Frontiers in Neuroscience. We analyzed 200+ BCI studies from the past decade and identified key challenges and opportunities. The field is advancing rapidly - we're getting closer to practical BCIs for communication, rehabilitation, and augmented cognition. Open access link in comments!",
      media: [],
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: studentUsers[4]._id.toString(),
      text: "Excited to start my new position as a Research Assistant on the Smart Cities project! We'll be deploying IoT sensors across Hoboken to monitor air quality, traffic, and energy usage. This real-world data will help develop better urban planning models. Thanks Dr. Lee for this opportunity!",
      media: [],
      createdAt: daysAgo(11),
      updatedAt: daysAgo(11),
      likeCount: 0,
      commentCount: 0,
    },
    {
      userId: professorUsers[9]._id.toString(),
      text: "Our lab's autonomous drone swarm successfully coordinated search and rescue operations in simulated disaster scenarios! 20 drones worked together using decentralized AI to locate survivors 40% faster than traditional methods. This technology could save lives in earthquakes, floods, and other emergencies. Video demonstration attached.",
      media: [
        { type: "VIDEO", url: "https://www.w3schools.com/html/movie.mp4", thumbnailUrl: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800", alt: "Drone swarm demonstration" }
      ],
      createdAt: daysAgo(12),
      updatedAt: daysAgo(12),
      likeCount: 0,
      commentCount: 0,
    }
  ];

  // Insert posts
  const insertedPosts = await postCollection.insertMany(postsData);
  console.log(`Inserted ${Object.keys(insertedPosts.insertedIds).length} posts`);

  // Get all inserted post IDs
  const allPostIds = Object.values(insertedPosts.insertedIds);

  // Add likes to posts (random distribution)
  const likesData = [];
  for (let i = 0; i < allPostIds.length; i++) {
    const postId = allPostIds[i].toString();
    const numLikes = Math.floor(Math.random() * 30) + 5; // 5-35 likes per post
    const likers = randomUsers(allUsers, numLikes);

    for (const liker of likers) {
      likesData.push({
        postId,
        userId: liker._id.toString(),
        createdAt: new Date(now - Math.random() * 12 * 24 * 60 * 60 * 1000).toISOString() // Within last 12 days
      });
    }
  }

  if (likesData.length > 0) {
    await postLikesCol.insertMany(likesData);
    console.log(`Inserted ${likesData.length} likes`);

    // Update like counts on posts
    for (const postId of allPostIds) {
      const likeCount = likesData.filter(l => l.postId === postId.toString()).length;
      await postCollection.updateOne(
        { _id: postId },
        { $set: { likeCount } }
      );
    }
  }

  // Add comments to posts (2-8 comments per post)
  const commentsData = [];
  const commentTexts = [
    "This is groundbreaking research! Congratulations to the team!",
    "Fantastic work! Would love to learn more about the methodology.",
    "This aligns perfectly with my research interests. Can we discuss potential collaboration?",
    "Impressive results! Have you considered publishing in [Journal Name]?",
    "Congratulations! This will have significant real-world impact.",
    "I attended your presentation and was blown away. Excellent work!",
    "This is exactly the kind of innovation we need. Well done!",
    "Very interesting approach. Have you faced any scalability challenges?",
    "Amazing achievement! Looking forward to reading the full paper.",
    "This could revolutionize the field. Great job!",
    "Proud to be part of the Stevens research community seeing work like this!",
    "Wow, this is incredible progress. What's next for the project?",
    "I'd love to contribute to this research. Are you looking for collaborators?",
    "This has huge implications for [application area]. Exciting times!",
    "Congratulations on this milestone! Your hard work is paying off.",
    "This is why Stevens is leading in research innovation!",
    "Have you considered the ethical implications of this technology?",
    "Brilliant work! The engineering behind this is remarkable.",
    "This could be a game-changer for the industry.",
    "So proud of our research team! Keep pushing boundaries!"
  ];

  for (let i = 0; i < allPostIds.length; i++) {
    const postId = allPostIds[i].toString();
    const numComments = Math.floor(Math.random() * 7) + 2; // 2-8 comments

    for (let j = 0; j < numComments; j++) {
      const commenter = randomUser(allUsers);
      const commentText = commentTexts[Math.floor(Math.random() * commentTexts.length)];
      const commentAge = Math.random() * (12 - i) * 24 * 60 * 60 * 1000; // Comments newer than post

      commentsData.push({
        postId,
        userId: commenter._id.toString(),
        text: commentText,
        createdAt: new Date(now - commentAge).toISOString(),
        updatedAt: new Date(now - commentAge).toISOString()
      });
    }
  }

  if (commentsData.length > 0) {
    await postCommentsCol.insertMany(commentsData);
    console.log(`Inserted ${commentsData.length} comments`);

    // Update comment counts on posts
    for (const postId of allPostIds) {
      const commentCount = commentsData.filter(c => c.postId === postId.toString()).length;
      await postCollection.updateOne(
        { _id: postId },
        { $set: { commentCount } }
      );
    }
  }

  console.log("Posts seeding complete!");
};

const main = async () => {
  const db = await dbConnection();

  // Drop individual collections instead of entire database (Atlas free tier restriction)
  console.log("Dropping existing collections...");
  try {
    await db.collection('users').drop().catch(() => console.log("users collection doesn't exist yet"));
    await db.collection('projects').drop().catch(() => console.log("projects collection doesn't exist yet"));
    await db.collection('applications').drop().catch(() => console.log("applications collection doesn't exist yet"));
    await db.collection('posts').drop().catch(() => console.log("posts collection doesn't exist yet"));
    await db.collection('postLikes').drop().catch(() => console.log("postLikes collection doesn't exist yet"));
    await db.collection('postComments').drop().catch(() => console.log("postComments collection doesn't exist yet"));
    console.log("Collections dropped successfully");
  } catch (error) {
    console.log("Error dropping collections (might be first run):", error.message);
  }

  await seedUsers();
  await seedProjects();
  await seedStudents();
  await seedApplications();
  await seedPosts();
  closeConnection();
};

main();
