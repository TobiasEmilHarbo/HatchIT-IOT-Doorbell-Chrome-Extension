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
    
    await admin.messaging().sendToDevice(
        [
            'drE9uCjSQ2o:APA91bHR3kM3KiyM_gD0t2AR2rAiEbtfwTlJrUKhLF4XO5uGZn9CgHnSpQQWWriKjVzdyECxhi3ZNt7EPeErLSWEpKvCczeMvihBHJKW27JCfi5xOLd9COYAIhuMXZ0npQ5ofmmdXF9H'
        ],
        {
            data : {
                title : 'yoyoyoyo',
                body : 'YOYOYOYO',
                icon : ''
			}
        }
    )
    
    return admin.firestore().collection('notifications').add({
        notify : true,
        at : admin.firestore.FieldValue.serverTimestamp()
    })
})

exports.notify = functions.https.onRequest(async (req, res) => {
    await admin.messaging().sendToDevice(
        [
            'drE9uCjSQ2o:APA91bHR3kM3KiyM_gD0t2AR2rAiEbtfwTlJrUKhLF4XO5uGZn9CgHnSpQQWWriKjVzdyECxhi3ZNt7EPeErLSWEpKvCczeMvihBHJKW27JCfi5xOLd9COYAIhuMXZ0npQ5ofmmdXF9H'
        ],
        {
            data : {
                title : 'yoyoyoyo',
                body : 'YOYOYOYO',
                icon : ''
			}
        }
    )
    
    await admin.firestore().collection('notifications').add({
        notify : true,
        at : admin.firestore.FieldValue.serverTimestamp()
    })

    res.end()
});
  