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
    
    return notify(message)
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const publicRouter = express.Router()
app.use('/', publicRouter)

publicRouter.route('/notify')
    .post(async (req: express.Request, res: express.Response) => {
        try
        {
            await notify()
            res.status(200).json({
                message: 'Notification sent'
            })
    
        }
        catch(error)
        {
            res.status(500).json({
                error : error.message,
                message: 'Notification failed to be sent'
            })
    
        }
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

const notify = async (message?: functions.pubsub.Message) => {

    return admin.firestore().collection('apps').where('muted', '==', false).get().then(snapshot => {
        const tokens = Array()

        let payload = { battery_level : undefined }

        if(message)
        {
            const decodePayload = Buffer.from(message.data, 'base64').toString('ascii')
            payload 		    = JSON.parse(decodePayload)
        }

        snapshot.forEach(doc => {

            const {
                token,
                muted,
                officeHours,
                officeHoursOnly,
                timezoneOffset,
                systemNotifications
            } = doc.data()

            if(!token || muted) return 

            if(!officeHoursOnly)
            {
                if(!systemNotifications)
                {
                    doc.ref.set({
                        notifyBrowser : true
                    }, { merge : true }).catch(error => {console.error(error)})

                    return
                }

                tokens.push(token)
                
                return
            }

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
    
            if(!withInOfficeHours) return

            if(!systemNotifications)
            {
                doc.ref.set({
                    notifyBrowser : true
                }, { merge : true }).catch(error => {console.error(error)})
                return
            }

            tokens.push(token)
        })

        const promisses = Array()
        
        if(tokens.length > 0)
        {
            promisses.push(
                admin.messaging().sendToDevice(tokens, {data : {}})
            )
        }

        promisses.push(
            admin.firestore().collection('notifications').add({
                dismissed : false,
                battery_level : payload.battery_level,
                at : admin.firestore.FieldValue.serverTimestamp()
            })
        )

        promisses.push(
            admin.firestore().collection('notifications').doc('counter').set({
                notificaions : admin.firestore.FieldValue.increment(1)
            }, {merge: true})
        )

        return Promise.all(promisses)
    })
    .catch(err => {
        console.error('Error sending notifications', err);
    })
}