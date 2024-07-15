const express = require('express')
const app = express()
const cors = require('cors')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const { format, parse, formatDate } = require('date-fns')

require('dotenv').config()


app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//connect mongodb atlas
mongoose.connect(process.env.mongoUrl);

//user schema
const userSchema = mongoose.Schema({
  username: String
})

//user model
const userModel = mongoose.model('user', userSchema);

//exercise schema
const exerciseSchema = mongoose.Schema({
  description: String,
  duration: Number,
  date: String,
  userId: String
})

//exerciseModel
const exerciseModel = mongoose.model('exercise', exerciseSchema);


// function generateRandomId(length = 24) {
//   return crypto.randomBytes(length / 2).toString('hex');
// }


// let users = [];
// let exercise = [];
// let exerciseForLog = {};
// let username = null;
// let _id = null;
// let description, duration, date;


app.post('/api/users', (req, res) => {
  try {
    const username = req.body.username;

    if (username != '') {
      userModel.create({ username: username })
        .then(result => {
          res.json({ username: result.username, _id: result._id })
        })
        .catch(err => res.json({ error: err }))
    }
    else {
      console.log("error occure due to invalid")
      res.status(404).json("error");
    }
  } catch (error) {
    res.json(error)
  }

});


app.get('/api/users', (req, res) => {
  userModel.find({})
    .then(result => {
      // console.log(result)
      res.json(result)
    })
    .catch(err => res.json({ error: err }))
});

app.post('/api/users/:_id/exercises', (req, res) => {
  try {
    let { description, duration, date } = req.body;

    // console.log(`upcoming date = ${date}`)
    const id = req.params._id;
    if (userModel.findById({ _id: id })) {

      // console.log(user.username)
      duration = parseInt(duration, 10);

      const dateString = date;
      let dateObj;
      // const dateString =date.toString();
      // console.log(`dateString = ${dateString}`)
      if (typeof dateString === 'string') {

        dateObj = new Date(dateString);
      }
      else {
        dateObj = new Date();
      }

      date = dateObj;
      // date = dateObj.toDateString();

      exerciseModel.create({ description: description, duration: duration, date: date, userId: id })
        .then(result => {
          // console.log({description: description, duration: duration, date: date, _id: result._id,userId:result.userId})
        })
        .catch(err => {
          console.log(err)
        })

      userModel.findById({ _id: id })
        .then(result => {
          // console.log({result:result})
          //  console.log({ username: result.username, description: description, duration: duration, date: date, _id: result._id });
          res.json({ username: result.username, description: description, duration: duration, date: new Date(date).toDateString(), _id: result._id });
        })
        .catch(err => {
          console.log(err)
        })

    }
    else {
      console.log("error occured in line 105")
      return res.status(404).json({ error: error });
    }
  } catch (error) {
    console.log(`error  occured in line 109 ${error}`)
    res.json({ error: error });
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const id = req.params._id;
    // let description;
    // let duration;
    // let date;
    let from = req.query.from; // Assuming query string for dates
    let to = req.query.to;
    const limit =req.query.limit; // Default limit
    // from=new Date(from).toDateString();
    // to=new Date(to).toDateString();
    // const logs = await fetchLogs( from, to, limit);
    console.log({ from: from, to: from, limit: limit })


    // console.log(userName)
    // exerciseModel.find({userId:id})
    // .then(results=>{
    //   exercises=results.map(entry => {
    //     return {
    //         description: entry.description,
    //         duration: entry.duration,
    //         date: entry.date
    //     };
    // });
    //   // console.log("exercise =",exercises);
    // })
    // .catch(err=>{
    //   console.log(err)
    // })

    // console.log("count=",count)
    // console.log({ username: userName,
    //   count: count[0].count,
    //   _id: id,
    //   log: exercises

    // })
    let exercises;
    exerciseModel.find({ userId: id })
      .then(async (results) => {


        let exercise = exerciseModel.find({ userId: id });

        if (from) {
          exercise = exercise.where('date').gte(new Date(from));
        }

        if (to) {
          exercise = exercise.where('date').lte(new Date(to));
        }

        if (limit) {
          exercise = exercise.limit(limit);
        }

        exercise = await exercise;

        exercises = await exercise.map(entry => {
          return {
            description: entry.description,
            duration: entry.duration,
            date: new Date(entry.date).toDateString(),

          };
        })

        userModel.findById({ _id: id })
          .then(async (result) => {
            let num = await exerciseModel.aggregate([
              { $match: { userId: id } }, // Match documents with the specific value
              { $group: { _id: '$userId', count: { $sum: 1 } } }, // Group by the attribute and count occurrences
            ]);

            let username = await result.username;
            let count = await num.length > 0 ? num[0].count : 0;
            let userId = await result._id;

            // console.log(result.username)
            // userName=result.username;

            console.log({
              username: username,
              count: count,
              _id: userId,
              log: exercises

            })
            res.json({
              username: username,
              count: count,
              _id: userId,
              log: exercises
            })



            // console.log("exercise =",exercises);
          })
          .catch(err => {
            console.log(err)
          })

      })
      .catch(err => {
        console.log(err);
      })

  } catch (error) {
    res.json({ error: error });
  }
})


// app.get('/api/users/:_id/logs', (req, res) => {
//   let _id = req.params._id;
//   if (users.find(item => item._id === _id)) {
//     let user=users.find(item => item._id === _id)
//     const responseObject = {
//       user,
//       count: 0,
//       log: []
//     };
//     console.log({
//       username:user.username,
//       count:exercise.length,
//       _id:user._id,
//       log: [{
//         description: description,
//         duration: parseInt(duration, 10),
//         date: exerciseForLog.date,
//       }]
//     });
//     res.status(200).json({
//       username:user.username,
//       count:exercise.length,
//       _id:user._id,    
//       log: [{
//         description: description,
//         duration: parseInt(duration, 10),
//         date: exerciseForLog.date,
//       }]
//     });
//   }
// })

// function isValidDate(dateString) {
//   const regEx = /^\d{4}-\d{2}-\d{2}$/;
//   // Invalid format
//   if(!dateString.match(regEx)) return false;
//   const d = new Date(dateString);
//   const dNum = d.getTime();
//   // NaN value, Invalid date
//   if (!dNum && dNum !== 0) return false;
//   return d.toISOString().slice(0,10) === dateString;
// }


// app.post('/api/users/:_id/exercises',async function (req,res){

//   try {
//     const id=req.params._id;
//     description=req.body.description;
//     duration=req.body.duration;
//     date=req.body.date;
//     const user=users.find(user=>user._id===id);
//     let formattedDate
//    if(user){
//     const dateString = `${date}`;
//     const parsedDate = parse(dateString, 'yyyyMMdd', new Date());
//     if (!isNaN(parsedDate)) {
//        formattedDate = format(parsedDate, 'd MMMM yyyy');
//        dateForLog=formattedDate;
//       console.log(formattedDate); // Output: 13 July 2024
//       exerciseForLog.date=formattedDate;
//   } else {
//     if(parsedDate===''){

//       formattedDate = new Date().toDateString();
//       dateForLog=formattedDate;
//       exerciseForLog.date=formattedDate;
//     }
//     else{
//      return res.json({error:"error"})
//     }
//   }

//     const newExercise = {
//       description,
//       duration: parseInt(duration, 10),
//       date: formattedDate
//     };
//     exerciseForLog.date=formattedDate;
//     exercise.push(newExercise);
//     const error = newExercise.validateSync();
//   if (error) {
//     const errMsg = { '':'Error(s)'};
//     if (error && error.errors.userid !== undefined) {
//       errMsg.id = error.errors.userid.message;
//     }
//     if (error && error.errors.description !== undefined) {
//       errMsg.description = error.errors.description.message;
//     }
//     if (error && error.errors.duration !== undefined) {
//       errMsg.duration = error.errors.duration.message;
//     }
//     if (error && error.errors.date !== undefined) {
//       errMsg.date = error.errors.date.message;
//     }
//     return res.json(errMsg);
//   }

//     // Respond with the user object and exercise fields
//     const responseObject = {
//       username: user.username,
//       description: newExercise.description,
//       duration: newExercise.duration,
//       date: newExercise.date,
//       _id: user._id
//     };

//     console.log(responseObject);
//     res.json({username: user.username,
//       description: description,
//       duration: duration,
//       date: date,
//       _id: user._id});

//     // console.log(description,duration,date);
//     // res.json({description:description,duration:duration,date:date})
//    }
//    else{
//     res.status(404).json({error:"error occur"});
//    }
//   } catch (error) {
//     res.json({error:"error"});
//   }
// })


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
