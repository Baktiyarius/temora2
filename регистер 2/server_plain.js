const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')

const root = __dirname
const port = process.env.PORT || 3000

const dataDir = path.join(root, 'data_plain')
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
const usersFile = path.join(dataDir, 'users.json')
const bookingsFile = path.join(dataDir, 'bookings.json')
const mastersFile = path.join(dataDir, 'masters.json')

function readJSON(file, def){ try{ if(!fs.existsSync(file)) return def; return JSON.parse(fs.readFileSync(file,'utf8')||'null') }catch(e){ return def } }
function writeJSON(file, data){ fs.writeFileSync(file, JSON.stringify(data,null,2),'utf8') }

// ensure initial data
if(!fs.existsSync(usersFile)) writeJSON(usersFile, [{id:1,name:'Админ',email:'admin@temora.kz',phone:'',password:'',role:'admin'}])
if(!fs.existsSync(bookingsFile)) writeJSON(bookingsFile, [])
if(!fs.existsSync(mastersFile)) writeJSON(mastersFile, [])

function serveStatic(req, res){
  let parsed = url.parse(req.url)
  let pathname = decodeURIComponent(parsed.pathname)
  if(pathname === '/' || pathname === '/admin') pathname = '/index.html'
  const filePath = path.join(root, pathname)
  if(!filePath.startsWith(root)) return send404(res)
  fs.readFile(filePath, (err, data)=>{
    if(err) return send404(res)
    const ext = path.extname(filePath).toLowerCase()
    const map = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'}
    res.writeHead(200, {'Content-Type': map[ext] || 'application/octet-stream'})
    res.end(data)
  })
}

function sendJSON(res, obj, code=200){ res.writeHead(code, {'Content-Type':'application/json'}); res.end(JSON.stringify(obj)) }
function send404(res){ res.writeHead(404); res.end('Not found') }

const server = http.createServer((req,res)=>{
  const parsed = url.parse(req.url, true)
  const pathname = parsed.pathname
  if(pathname.startsWith('/api/')){
    // simple API
    if(req.method === 'GET' && pathname === '/api/users'){
      return sendJSON(res, readJSON(usersFile,[]))
    }
    if(req.method === 'POST' && pathname === '/api/auth'){
      let body=''; req.on('data',c=>body+=c); req.on('end',()=>{
        try{ const p = JSON.parse(body); let users = readJSON(usersFile,[]); let user = users.find(u=>u.email===p.email)
          if(!user){ const id = Date.now(); user = {id,name:p.name,email:p.email,phone:p.phone||'',password:p.password||'',role:'user'}; users.push(user); writeJSON(usersFile,users) }
          return sendJSON(res, {user})
        }catch(e){ return sendJSON(res,{error:'bad body'},400) }
      })
      return
    }

    if(req.method === 'GET' && pathname === '/api/bookings'){
      return sendJSON(res, readJSON(bookingsFile,[]))
    }

    if(req.method === 'POST' && pathname === '/api/book'){
      let body=''; req.on('data',c=>body+=c); req.on('end',()=>{
        try{ const b = JSON.parse(body); let bs = readJSON(bookingsFile,[]); const id = Date.now(); const rec = Object.assign({id}, b); bs.push(rec); writeJSON(bookingsFile, bs); return sendJSON(res,{id}) }catch(e){ return sendJSON(res,{error:'bad body'},400) }
      })
      return
    }

    if(req.method === 'DELETE' && pathname.startsWith('/api/bookings/')){
      const id = Number(pathname.split('/').pop())
      let bs = readJSON(bookingsFile,[]); bs = bs.filter(b=>b.id!==id); writeJSON(bookingsFile,bs); return sendJSON(res,{ok:true})
    }

    if(req.method === 'POST' && pathname === '/api/admin/login'){
      let body=''; req.on('data',c=>body+=c); req.on('end',()=>{
        try{ const p = JSON.parse(body); if(p.password === 'temora2025') return sendJSON(res,{ok:true}); return sendJSON(res,{error:'unauthorized'},401) }catch(e){ return sendJSON(res,{error:'bad body'},400) }
      })
      return
    }

    return sendJSON(res,{error:'unknown api'},404)
  }

  // static
  serveStatic(req,res)
})

server.listen(port, ()=> console.log('Plain server running at http://localhost:'+port))
