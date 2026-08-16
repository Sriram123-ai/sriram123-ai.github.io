require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(session({
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { index: 'index.html' }));

function safeEmployee(row) {
  if (!row) return null;
  return { id:row.id, name:row.name, role:row.role, phone:row.phone, email:row.email, blood:row.blood,
    dob:row.dob, place:row.place, doj:row.doj, founder:row.founder, projects:row.projects || [] };
}
function requireAuth(req,res,next){ if(!req.session.employeeId) return res.status(401).json({error:'Authentication required'}); next(); }
async function currentEmployee(req){
  if(!req.session.employeeId) return null;
  const {rows}=await pool.query('SELECT * FROM employees WHERE id=$1 AND active=TRUE',[req.session.employeeId]);
  return safeEmployee(rows[0]);
}
async function requireFounder(req,res,next){
  const emp=await currentEmployee(req); if(!emp) return res.status(401).json({error:'Authentication required'});
  if(!emp.founder) return res.status(403).json({error:'Founder access required'}); req.employee=emp; next();
}

app.get('/api/health', async (_req,res)=>{
  try { await pool.query('SELECT 1'); res.json({ok:true, service:'nexora', database:'connected'}); }
  catch(e){ res.status(503).json({ok:false,database:'unavailable'}); }
});

app.post('/api/auth/login', async (req,res)=>{
  try {
    const id=String(req.body.id||'').trim().toUpperCase(), pin=String(req.body.pin||'').trim();
    if(!id || !/^\d{4}$/.test(pin)) return res.status(400).json({error:'Employee ID and 4-digit PIN are required'});
    const {rows}=await pool.query('SELECT * FROM employees WHERE UPPER(id)=UPPER($1) AND active=TRUE',[id]);
    const emp=rows[0];
    if(!emp || !(await bcrypt.compare(pin,emp.pin_hash))) return res.status(401).json({error:'Invalid Employee ID or PIN'});
    req.session.employeeId=emp.id;
    req.session.save(err=>{ if(err) return res.status(500).json({error:'Could not create session'}); res.json({employee:safeEmployee(emp)}); });
  } catch(e){ console.error(e); res.status(500).json({error:'Login failed'}); }
});
app.get('/api/auth/me', async (req,res)=>{ try { const emp=await currentEmployee(req); res.json({authenticated:!!emp,employee:emp}); } catch(e){res.status(500).json({error:'Session lookup failed'});} });
app.post('/api/auth/logout',(req,res)=>req.session.destroy(err=>{ if(err) return res.status(500).json({error:'Logout failed'}); res.clearCookie('connect.sid'); res.json({ok:true}); }));
app.post('/api/auth/change-pin',requireAuth,async(req,res)=>{
  const pin=String(req.body.pin||'').trim();
  if(!/^\d{4}$/.test(pin)) return res.status(400).json({error:'PIN must be exactly 4 digits'});
  const hash=await bcrypt.hash(pin,12); await pool.query('UPDATE employees SET pin_hash=$1,updated_at=NOW() WHERE id=$2',[hash,req.session.employeeId]); res.json({ok:true});
});

app.get('/api/state', requireAuth, async (_req,res)=>{
  const {rows}=await pool.query('SELECT resource,data FROM portal_state');
  const out={}; for(const r of rows) out[r.resource]=r.data; res.json(out);
});
app.post('/api/state/:resource', requireAuth, async(req,res)=>{
  const allowed=new Set(['requests','announcements','attendance','daily_logs','tasks','inventory','bom']);
  if(!allowed.has(req.params.resource)) return res.status(400).json({error:'Invalid resource'});
  await pool.query(`INSERT INTO portal_state(resource,data,updated_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT(resource) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()`,[req.params.resource,JSON.stringify(req.body.data ?? null)]);
  res.json({ok:true});
});

app.post('/api/contact', async(req,res)=>{
  const {firstName,lastName,email,company,type,message}=req.body||{};
  if(!String(firstName||'').trim() || !String(email||'').trim()) return res.status(400).json({error:'First name and email are required'});
  await pool.query('INSERT INTO contact_messages(first_name,last_name,email,company,inquiry_type,message) VALUES($1,$2,$3,$4,$5,$6)',[firstName,lastName||'',email,company||'',type||'',message||'']);
  res.status(201).json({ok:true});
});
app.post('/api/careers', async(req,res)=>{
  const {name,email,phone,position,experience,coverLetter}=req.body||{};
  if(!String(name||'').trim() || !String(email||'').trim() || !String(position||'').trim()) return res.status(400).json({error:'Name, email and position are required'});
  await pool.query('INSERT INTO career_applications(name,email,phone,position,experience,cover_letter) VALUES($1,$2,$3,$4,$5,$6)',[name,email,phone||'',position,experience||'',coverLetter||'']);
  res.status(201).json({ok:true});
});
app.post('/api/support', async(req,res)=>{
  const {name,email,subject,priority,description}=req.body||{};
  if(!String(name||'').trim() || !String(email||'').trim() || !String(subject||'').trim()) return res.status(400).json({error:'Name, email and subject are required'});
  await pool.query('INSERT INTO support_tickets(name,email,subject,priority,description) VALUES($1,$2,$3,$4,$5)',[name,email,subject,priority||'',description||'']);
  res.status(201).json({ok:true});
});

app.get('/api/admin/summary', requireFounder, async (_req,res)=>{
  const [contacts,careers,tickets]=await Promise.all([
    pool.query('SELECT COUNT(*)::int count FROM contact_messages'),
    pool.query('SELECT COUNT(*)::int count FROM career_applications'),
    pool.query("SELECT COUNT(*)::int count FROM support_tickets WHERE status='open'")
  ]);
  res.json({contacts:contacts.rows[0].count,careers:careers.rows[0].count,openTickets:tickets.rows[0].count});
});

app.get('/*splat', (req,res)=>res.sendFile(path.join(publicDir,'index.html')));

app.listen(PORT,'0.0.0.0',()=>console.log(`Nexora server listening on ${PORT}`));
