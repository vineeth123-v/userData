const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'userData.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3002, () => {
      console.log('success')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const vaildPsaaword = (password) => {
  return password.length > 4
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashPassword = await bcrypt.hash(password, 10)
  const selectedUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const databaseUser = await db.get(selectedUserQuery)

  if (databaseUser === undefined) {
    const createUserQuery = `
    INSERT INTO 
     user(username, name, password, gender, location)
    VALUES
     {
      '${username}',
      '${name}',
      '${hashPassword}',
      '${gender}',
      '${location}'
     };
    `
    if (vaildPsaaword(password)) {
      await db.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectedUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const databaseUser = await db.get(selectedUserQuery)

  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password,
    )
    if (isPasswordMatched == true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectedUserQuery = `SELECT * FROM user WHERE usernmae = '${username}';`
  const databaseUser = await db.get(selectedUserQuery)

  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordChanged = await bcrypt.compare(
      oldPassword,
      databaseUser.password,
    )
    if (isPasswordChanged == true) {
      if (vaildPsaaword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatedPassword = `
        UPDATE
         user
        SET
         password = '${hashedPassword}'
        WHERE
         username = '${username};'
        `
        const user = await db.run(updatedPassword)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
