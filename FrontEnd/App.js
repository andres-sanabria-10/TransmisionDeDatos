const express = require('express')

const path = require('path')

const app = express()

app.set('PORT', process.env.PORT || 3000)

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/view/index.html'))
})


app.listen(app.get('PORT'), () => console.log(`Server front in port ${app.get('PORT')}`))