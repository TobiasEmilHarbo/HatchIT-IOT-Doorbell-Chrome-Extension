import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'

try{
    admin.initializeApp()
}
catch(e){ console.log(e.message) }

const settings = { timestampsInSnapshots: true }

const adminFs = admin.firestore()
adminFs.settings(settings)

exports.doorbell = functions.pubsub.topic('doorbell').onPublish(async message => {
    return admin.firestore().collection('notifications').add({
        notify : true,
        at : admin.firestore.FieldValue.serverTimestamp()
    })
})