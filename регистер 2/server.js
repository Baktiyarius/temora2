const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const Database = require('better-sqlite3')

const app = express()
app.use(cors())
app.use(bodyParser.json())

const dbFile = path.join(__dirname, 'temora.db')
const db = new Database(dbFile)

// init tables
db.prepare(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, phone TEXT, password TEXT, role TEXT)`).run()
db.prepare(`CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY, userId INTEGER, name TEXT, phone TEXT, master TEXT, category TEXT, service TEXT, price INTEGER, date TEXT, time TEXT)`).run()

// ensure admin exists
const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@temora.kz')
if(!admin){ db.prepare('INSERT INTO users (name,email,phone,password,role) VALUES (?,?,?,?,?)').run('Админ','admin@temora.kz','','', 'admin') }

app.use(express.static(__dirname))

// API: get users
app.get('/api/users', (req,res)=>{
  const rows = db.prepare('SELECT id,name,email,phone,role FROM users').all()
  res.json(rows)
})

// register/login (simplified)
app.post('/api/auth', (req,res)=>{
  const {name,email,phone,password} = req.body
  if(!email) return res.status(400).json({error:'no email'})
  let user = db.prepare('SELECT id,name,email,phone,role,password FROM users WHERE email = ?').get(email)
  if(!user){ const info = db.prepare('INSERT INTO users (name,email,phone,password,role) VALUES (?,?,?,?,?)').run(name,email,phone,password || '', 'user'); user = {id: info.lastInsertRowid, name, email, phone, role:'user'} }
  res.json({user})
})

// bookings endpoints
app.get('/api/bookings', (req,res)=>{
  const rows = db.prepare('SELECT * FROM bookings').all()
  res.json(rows)
})

app.post('/api/book', (req,res)=>{
  const b = req.body
  const info = db.prepare('INSERT INTO bookings (userId,name,phone,master,category,service,price,date,time) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(b.userId,b.name,b.phone,b.master,b.category,b.service,b.price,b.date,b.time)
  res.json({id: info.lastInsertRowid})
})

app.delete('/api/bookings/:id',(req,res)=>{
  const id = Number(req.params.id)
  db.prepare('DELETE FROM bookings WHERE id = ?').run(id)
  res.json({ok:true})
})

// admin simple auth (password temora2025)
app.post('/api/admin/login',(req,res)=>{
  const {password} = req.body
  if(password==='temora2025') return res.json({ok:true})
  res.status(401).json({error:'unauthorized'})
})

const port = process.env.PORT || 3000
app.listen(port, ()=> console.log('Server started on',port))

// Serve index.html for admin route (SPA)
app.get('/admin', (req,res)=>{
  res.sendFile(path.join(__dirname, 'index.html'))
})

// Catch-all to support client-side routing (after API routes)
app.get('*', (req,res)=>{
  // if request path starts with /api, return 404
  if(req.path.startsWith('/api')) return res.status(404).json({error:'Not found'})
  res.sendFile(path.join(__dirname, 'index.html'))
})
