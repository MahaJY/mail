const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;
const moment = require('moment');
require('dotenv').config();
const imapConfig = {
    user: process.env.gmail_username,
    password: process.env.gmail_emailpassword,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    }
};
const senderEmail = 'friendupdates@facebookmail.com';

const imap = new Imap(imapConfig);
async function fetchEmails(req, res) { 
    try {
        imap.once('ready', async () => {
            try {
                await openInbox();
                 const thirtydaysago = moment().subtract(30, 'days').toDate();
                const results = await searchEmails(thirtydaysago);
                await deleteEmails(results)
                const emails = {};
                let fetchedEmailsCount = 0;
                if (!results || results.length === 0) {
                    console.log('No emails found matching the search criteria.');
                    imap.end();
                    return res.json(emails);
                }
                
                await deleteEmails(results);

                imap.end();
                console.log(`Found ${results.length} emails from ${senderEmail}`);
                return res.json({ mailcount: results.length,message:'email moved to bin successfully' });
               
            } catch (error) {
                console.error('Error:', error);
                return res.status(500).json({ error: 'An error occurred' });
            }
        });
        imap.once('error', (err) => {
            console.error('IMAP connection error:', err);
            return res.status(500).json({ error: 'IMAP connection error', details: err });
        });
        imap.once('end', () => {
            console.log('IMAP connection ended');
        });

        imap.connect();
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
}
function openInbox() {
    return new Promise((resolve, reject) => {
        imap.openBox('INBOX', false, (err, box) => {
            if (err) {
                console.error('Error opening INBOX:', err);
                reject({ error: 'Error opening INBOX', details: err });
            } else {
                console.log('INBOX opened successfully');
                resolve();
            }
        });
    });
}
function searchEmails(thirtydaysago) {
    return new Promise((resolve, reject) => {
        const searchCriteria = [
            ['FROM', senderEmail],
            ['SINCE', thirtydaysago.toISOString()],
        ];
        imap.search(searchCriteria, (err, results) => {
            if (err) {
                console.error('Error searching emails:', err);
                reject({ error: 'Error searching emails', details: err });
            } else {
                console.log('Emails searched successfully',results);
                resolve(results);
            }
        });
    });
}
async function deleteEmails(results) {
    return new Promise((resolve, reject) => {
        imap.move(results, '[Gmail]/Bin', (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('Emails moved to Trash successfully');
                resolve();
            }
        });
    });
}
async function deleteEmails(results) {
    return new Promise((resolve, reject) => {
        imap.seq.addFlags(results, '\\Deleted', (err) => {
            if (err) {
                reject(err);
            } else {
                imap.expunge((expungeErr) => {
                    if (expungeErr) {
                        reject(expungeErr);
                    } else {
                        console.log('Emails marked for deletion and expunged successfully');
                        resolve();
                    }
                });
            }
        });
    });
}

module.exports ={fetchEmails}
