import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt';
import User from './schema/User.js'
import passport from 'passport';
import {
    Strategy as LocalStrategy
} from 'passport-local';
import * as url from 'url';

const __filename = url.fileURLToPath(
    import.meta.url);
const __dirname = url.fileURLToPath(new URL('.',
    import.meta.url));

const app = express()
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))
app.use(express.static(__dirname + '/public'))

const PORT = process.env.port || 8080
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`))

mongoose.connect('mongodb+srv://mdavancens:marianCoder@mariancoder.m5prr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, err => {
    if (err) throw new Error("Couldn't connect to db ")
    console.log('db connected ')
})

app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://mdavancens:marianCoder@mariancoder.m5prr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
        ttl: 10000
    }),
    secret: 'gd45fs15s8',
    resave: false,
    saveUninitialized: false

}))

const createHash = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10))
}

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    return done(null, user.id);
})

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        return done(err, user)
    })
})

passport.use('signup', new LocalStrategy({
    passReqToCallback: true
}, (req, username, password, done) => {
    User.findOne({
        username: username
    }, (err, user) => {
        if (err) return done(err);
        if (user) return done(null, false, {
            message: 'user already exists'
        });
        const newUser = {
            username: username,

            password: createHash(password)
        }
        User.create(newUser, (err, userCreated) => {
            if (err) return done(err);
            return done(null, userCreated)
        })
    })
}))

passport.use('homeLogin', new LocalStrategy({
    passReqToCallback: true
}, (req, username, password, done) => {
    console.log(username)
    User.findOne({
        username: username
    }, (err, user) => {
        if (err) done(err)
        if (user) {
            if (!bcrypt.compareSync(password, user.password)) {
                console.log('wrong password')
                return done(null, false)
            } else {
                return done(null, user)
            }
        } else {
            return done(null, {
                message: 'No user found'
            })
        }
    })
}))


app.get('/', (req, res) => {
    res.sendFile('login.html', {
        root: './views'
      });
})

app.get('/signup', (req, res) => {
    res.sendFile('signup.html', {
        root: './views'
      });
})

app.get('/profile', (req, res) => {
    res.sendFile('index.html', {
        root: './views'
      });
})

app.get('/tryagain', (req, res) => {
    res.sendFile('wrongUser.html', {
        root: './views'
      });
})

app.get('/logout', (req, res) => {
    res.sendFile('logout.html', {
        root: './views'
      });
})


app.post('/', passport.authenticate('homeLogin', {
    failureRedirect: '/tryagain'
}),  (req, res) => {
    res.sendFile('index.html', {
        root: './views'
      });
})

app.post('/signup', passport.authenticate('signup', {
    failureRedirect: '/wrongUser'
}), (req, res) => {
    res.redirect('/profile')
})


app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/')
    })
})

