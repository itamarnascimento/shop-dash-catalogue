import webPush from 'web-push';

 const vapidKeys = webPush.generateVAPIDKeys();

console.log('Public Key:\n', vapidKeys.publicKey);
console.log('Private Key:\n', vapidKeys.privateKey);