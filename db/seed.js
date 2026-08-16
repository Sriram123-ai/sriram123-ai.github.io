require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const employees = [
  { id:'2501-RD-001', name:'N Nagaraju', role:'Founder & Director', phone:'9133662156', email:'nagaraju087e@gmail.com', blood:'B+', dob:'17-07-2006', place:'Velugubanda', doj:'17-07-2025', founder:true, projects:['Portable ECG','Smart Learning Platform','Smart Attendance System','Overall Coordination'] },
  { id:'2501-RD-002', name:'Y Tejas', role:'Hardware Engineer', phone:'6305594309', email:'tejasyadavalli17@gmail.com', blood:'O+', dob:'17-12-2006', place:'Gokavaram', doj:'17-09-2025', founder:false, projects:['Portable ECG','Smart Learning Platform'] },
  { id:'2501-RD-003', name:'E Sriram', role:'Software Engineer', phone:'9515267936', email:'eagalasriram39@gmail.com', blood:'O+', dob:'10-12-2007', place:'Rajanagaram', doj:'10-10-2025', founder:false, projects:['Smart Learning Platform','Company Website'] },
  { id:'2601-HW-001', name:'P Vinay Kumar', role:'Hardware Engineer', phone:'8978734684', email:'pampanavinaykumar@gmail.com', blood:'A+', dob:'22-11-2005', place:'Kakinada', doj:'13-08-2026', founder:false, projects:['Portable ECG','Smart Attendance System'] }
];

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    for (const e of employees) {
      const defaultPin = e.phone.slice(-4);
      const hash = await bcrypt.hash(defaultPin, 12);
      await pool.query(`
        INSERT INTO employees (id,name,role,phone,email,blood,dob,place,doj,founder,projects,pin_hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role, phone=EXCLUDED.phone,
          email=EXCLUDED.email, blood=EXCLUDED.blood, dob=EXCLUDED.dob, place=EXCLUDED.place,
          doj=EXCLUDED.doj, founder=EXCLUDED.founder, projects=EXCLUDED.projects, active=TRUE,
          updated_at=NOW()
      `, [e.id,e.name,e.role,e.phone,e.email,e.blood,e.dob,e.place,e.doj,e.founder,JSON.stringify(e.projects),hash]);
    }
    const hardware = ['ESP32 Dev Board','Arduino Uno','Raspberry Pi 4','DHT11 / DHT22 Sensor','MAX30100 Pulse-ECG Sensor','RFID Reader Module','Breadboard','Jumper Wires Set','Soldering Kit','Digital Multimeter','LoRa Module','GSM / SIM800L Module','Li-ion Battery Pack','PCB Prototype Order'];
    const defaults = {
      requests: [], announcements: [], attendance: {}, daily_logs: [], tasks: [],
      inventory: hardware.map(name => ({name, qty:5, lowThreshold:2})), bom: []
    };
    for (const [resource,data] of Object.entries(defaults)) {
      await pool.query(`INSERT INTO portal_state(resource,data) VALUES($1,$2::jsonb) ON CONFLICT(resource) DO NOTHING`, [resource, JSON.stringify(data)]);
    }
    console.log('Nexora schema and employees seeded successfully.');
  } catch (err) { console.error(err); process.exitCode=1; }
  finally { await pool.end(); }
})();
