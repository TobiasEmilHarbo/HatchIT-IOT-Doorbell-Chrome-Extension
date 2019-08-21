import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as bodyParser from "body-parser";
import * as cors from 'cors'
const app = express()
app.use(cors({ origin: true }))

try{
    admin.initializeApp()
}
catch(e){ console.log(e.message) }

const settings = { timestampsInSnapshots: true }

const adminFs = admin.firestore()
adminFs.settings(settings)

exports.doorbell = functions.pubsub.topic('doorbell').onPublish(message => {
    
    return notify()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const publicRouter = express.Router()
app.use('/', publicRouter)

publicRouter.route('/notify')
    .post(async (req: express.Request, res: express.Response) => {
        await notify()
        res.status(200).json({
            message: 'Notification sent'
        })
    })

publicRouter.route('/uninstall/:id')
        
    .get(async (req: express.Request, res: express.Response) => {

        const extensionId = req.params.id

        await admin.firestore().collection('apps').doc(extensionId).delete()
        .catch((error) => {
            console.error(error)
        })

        res.status(200).json({
            message: 'Sorry to see you go!',
            id: extensionId
        })
    })

exports.httpOnRequest = functions.https.onRequest(app)

const notify = async () => {

    return admin.firestore().collection('apps').where('muted', '==', false).get().then(snapshot => {
        const tokens = Array()

        snapshot.forEach(doc => {

            const { token, muted, officeHours, officeHoursOnly, timezoneOffset } = doc.data()

            const {
                hoursStart,
                minsStart,
                hoursEnd,
                minsEnd
            } = officeHours

            const d     = new Date() // current time
            const hours = d.getHours() - timezoneOffset
            const mins  = String(d.getMinutes())

            const currentTime  = parseInt(hours + mins.padStart(2, '0'))
    
            const officeHoursStart  = parseInt(hoursStart + `${minsStart}`.padStart(2, '0'))
            const officeHoursEnd    = parseInt(hoursEnd   + `${minsEnd}`.padStart(2, '0'))
    
            const withInOfficeHours = (
                (officeHoursStart <= currentTime &&
                officeHoursEnd > currentTime) ||
                (officeHoursStart > currentTime &&
                officeHoursEnd >= currentTime)
            )
    
            if(muted || (!withInOfficeHours && officeHoursOnly) ) return

            if(token) tokens.push(token)
        })

        const promisses = Array()
        
        if(tokens.length > 0)
        {
            promisses.push(
                admin.messaging().sendToDevice(
                    tokens,
                    {
                        data : {
                            title : 'yoyoyoyo',
                            body : 'YOYOYOYO',
                            icon : ''
                        }
                    }
                )
            )
        }

        promisses.push(
            admin.firestore().collection('notifications').add({
                dismissed : false,
                at : admin.firestore.FieldValue.serverTimestamp()
            })
        )

        return Promise.all(promisses)
    })
    .catch(err => {
        console.error('Error sending notifications', err);
    })
}