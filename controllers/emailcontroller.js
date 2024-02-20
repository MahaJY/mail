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
const senderEmail = 'info@tnebnet.org';
const subjectKeyword = 'Reminder';
const imap = new Imap(imapConfig);
async function fetchEmails(req, res) { 
    try {
        imap.once('ready', async () => {
            try {
                await openInbox();
                 const thirtydaysago = moment().subtract(30, 'days').toDate();
                const results = await searchEmails(thirtydaysago);
                const emails = {};
                let fetchedEmailsCount = 0;
                if (results.length === 0) {
                    imap.end();
                    return res.json(emails);
                }
                for (const result of results) {
                    await processEmail(result, emails);
                    fetchedEmailsCount++;
                    if (fetchedEmailsCount === results.length) {
                        imap.end();
                        console.log(`Found ${fetchedEmailsCount} emails with subject containing "${subjectKeyword}" from ${senderEmail}`);
                        return res.json({ Remaindermailcount: fetchedEmailsCount, emails: emails });
                    }
                }
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
        imap.openBox('INBOX', true, (err, box) => {
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
            ['SUBJECT', subjectKeyword]
        ];
        imap.search(searchCriteria, (err, results) => {
            if (err) {
                console.error('Error searching emails:', err);
                reject({ error: 'Error searching emails', details: err });
            } else {
                console.log('Emails searched successfully');
                resolve(results);
            }
        });
    });
}
function processEmail(result, emails) {
    return new Promise((resolve, reject) => {
        const fetchOptions = {
            bodies: '',
            markSeen: false
        };
        const fetch = imap.fetch(result, fetchOptions);
        fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
                simpleParser(stream, (err, parsed) => {
                    if (err) {
                        console.error('Error parsing email:', err);
                        reject({ error: 'Error parsing email', details: err });
                    } else {
                        emails[result] = {
                            subject: parsed.subject,
                            body: parsed.text
                        };
                        console.log('Email parsed successfully');
                        resolve();
                    }
                });
            });
        });

        fetch.once('error', (err) => {
            console.error('Error fetching email:', err);
            reject({ error: 'Error fetching email', details: err });
        });
    });
}
module.exports = { fetchEmails };