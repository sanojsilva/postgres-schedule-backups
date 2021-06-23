const dotenv = require("dotenv");
const zip = require("gzipme");
const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const nodemailer = require("nodemailer");
const cron = require("node-cron");

dotenv.config();

const pgdumpPath = process.env.PG_DUMP_PATH;
const username = process.env.DB_USER;
const database = process.env.DB_NAME;
const pass = process.env.PGPASSWORD;
const email = process.env.EMAIL;
const emailPass = process.env.EMAIL_PASS;

const date = new Date();
const currentDate = `${date.getFullYear()}-${
  date.getMonth() + 1
}-${date.getDate()}-${date.getHours()}:${date.getMinutes()}`;
const fileName = `${database}-${currentDate}.sql`;

async function backup() {
  await exec(
    `${pgdumpPath} postgresql://${username}:${pass}@127.0.0.1:5432/${database} > backups/${fileName}`
  );
  console.log("Backup Successfull");
  // gzip the .sql file
  await zip(`backups/${fileName}`);
  console.log("Zip Successfull");
  // delete the .sql file
  fs.unlinkSync(`backups/${fileName}`);
}

async function sendEmail() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: email,
      pass: emailPass,
    },
  });

  const info = {
    from: '"Dev Backups 👻" <devsquadxbackups@gmail.com>',
    to: "devsquadx@gmail.com",
    subject: `Backups - ${database}`,
    html: "<b>Find the attached backup file</b>",
    attachments: [{ path: `backups/${fileName}.gz` }],
  };

  await transporter.sendMail(info);
  console.log("Email Sent Successfully");
}

async function main() {
  try {
    await backup();
    await sendEmail();
  } catch (err) {
    console.log(err);
  }
}

// run every day at 1:00 a.m.
cron.schedule("0 1 * * *", main);
