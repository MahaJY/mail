const {employee,personaldetails}= require('../models/employee');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const moment = require('moment')
require('dotenv').config(); 
const fs = require('fs');
const register = async(req,res)=>{
    const { name,designation,email,age,username,password,role,DOB,address,city,phoneNo} = req.body;
    try {
       const details = await personaldetails.create({
        DOB,
        address,
        city,
        phoneNo
       })
      const newUser = await employee.create({ 
        name,
        designation,
        email,
        age,
        username,
        password,
        role,
        personaldetails:details._id
     });
      const templateFile = fs.readFileSync('./assets/email.html', 'utf-8');
      const template = handlebars.compile(templateFile);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_PASSWORD
        }
    });
    const mailOptions = {
        from: process.env.GMAIL_EMAIL,
        to: email, 
        subject: 'Registration Confirmation',
        html: template({name})
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
    const scheduledTime = moment();
        scheduledTime.add(30,'minutes')
    const cronexp = ` ${scheduledTime.minutes()} ${scheduledTime.hours()} * * *`;
        const thankyoumail = {
            from: process.env.GMAIL_EMAIL,
            to: email,
            subject: 'Thank you for registering!',
            html: `Thank you  ${name} for registering with us.`
                };
    const cronjob= cron.schedule(cronexp, async () => {
        transporter.sendMail(thankyoumail, (error, info) => {
             if (error) {
                console.error('Error sending thank you email:', error);
            } else {
                console.log('Thank you email sent:', info.response);
            }cronjob.stop();
            });
        });
    res.status(201).json({ id: newUser.id, username });
    }
     catch (error) {
      console.error(error);
      res.status(500).send('Error registering user');
    }}
    const getempbyid = async(req,res)=>{
        try{
            const id = req.params.id
            const emp = await employee.findById(id).populate({path:'personaldetails',select:'phoneNo'});
            console.log(emp.pen)
            res.json(emp);
        } catch (error) {
            res.status(500).json({ message: "An error occurred", error:error.message });
        }
    }
    const getallemployees = async (req, res) => {
    try {
        const response = await employee.find().populate({path:'personaldetails'})
        res.json(response)
        }
      catch (error) {
        res.status(500).json({ message: "An error occurred", error:error.message });
    }
};


const getemployees = async (req, res, ) => {
    try {
        const ageFilter = { age: { $gt: 25 } };
        const  response= await employee.find(ageFilter).sort({ name: -1 });
        res.json({ response});
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error });
    }
};
const show = (req,res,next)=>{
    const employeeid = req.params.employeeid
    employee.findById(employeeid)
    
    .then(response =>{
        res.json({response})
    })
    .catch(error =>{
        res.json({message:"an error occured",error})
    })
}

const update = async (req, res) => {
    try {
        const id = req.body.id;
        const emp = await employee.findById(id).populate('personaldetails');
        if (!emp) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        console.log(emp)
        emp.name = req.body.name;
        emp.designation = req.body.designation;
        emp.email = req.body.email;
        emp.age = req.body.age;
        emp.username = req.body.username;
        emp.role = req.body.role;
        emp.personaldetails.DOB = req.body.DOB;
        emp.personaldetails.address = req.body.address; 
        emp.personaldetails.city = req.body.city;
        emp.personaldetails.phoneNo = req.body.phoneNo;
        const updatedemployee = await emp.save();
        res.json({ message: 'Employee updated successfully', updatedemployee });
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: "An error occurred", error: error.message });
    }
};
const updateemployees = async(req,res)=>{
    try {

        const id = req.params.id;
        const { name,designation,email ,age, username, role,DOB,address,city,phoneNo} = req.body;
        const emp = await employee.findById(id).populate('personaldetails');
        if (!emp) {
          return res.status(404).json({ message: 'employee not found' });
        }
        const updateemployee = await employee.findByIdAndUpdate(id, { name, designation,email,age,username,role,DOB,address, city,phoneNo}, { new: true })
         let updatedpersonaldetails
         if (emp.personaldetails) {
            updatedpersonaldetails = await personaldetails.findByIdAndUpdate(emp.personaldetails, { DOB, address, city, phoneNo }, { new: true });
        } 

        res.status(200).json({ message: 'employees and personaldetails updated successfully', updateemployee, updatedpersonaldetails });
      
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
      }
    }

    const delete1 = async (req, res, next) => {
        const employeeid = req.body.employeeid;
        try {
            const deletedEmployee = await employee.findOneAndDelete({ _id: employeeid });
            if (!deletedEmployee) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            res.json({ message: 'Employee deleted successfully', deletedEmployee });
        } catch (error) {
            res.status(500).json({ message: "An error occurred", error });
        }
    }
    const delete2 = async (req, res) => {
        const employeeId = req.body.employeeId; 
        try {
            const deletedEmployee = await employee.findOneAndDelete({ _id: employeeId });
            if (!deletedEmployee) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            const personalDetailsId = deletedEmployee.personaldetails;
            if (personalDetailsId) {
                await personaldetails.findByIdAndDelete(personalDetailsId);
            }
            res.json({ message: 'Employee and associated personal details deleted successfully', deletedEmployee });
        } catch (error) {
            res.status(500).json({ message: "An error occurred", error:error.message });
        }
    }
    
    const getbycity = async (req, res) => {
        try {
            const city= req.params.city
            console.log(city )
            const  empcity = await employee.find().populate('personaldetails','city');
            const filter = empcity.filter(item=>item.personaldetails.city===city)
            res.json( filter);
        } catch (error) {
            res.status(500).json({ message: "An error occurred", error :error.message});
        }
    };
    const getbycityquerymethod= async(req,res)=>{
        try{
        const city = req.params.city;
        console.log(city);
        const employeesincity = await employee.find().bycity(city);
        res.json(employeesincity);
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error: error.message });
    }
};
const getbycitystaticmethod= async(req,res)=>{
    try{
    const city = req.params.city;
    console.log(city);
    const employeesincity = await employee.findbycity(city);
    res.json(employeesincity);
} catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
}
};
const getbyusernamestaticmethod = async (req, res, next) => {
    try {
        const username = req.params.username
        console.log("Username:", username);
        const  response= await employee.findByusername(username).populate({path:'personaldetails',select:'address'});
        console.log("Employee:", employee);
        res.json( response);
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error:error.message });
    }
};
    const findByEmail = async(req,res)=>{
        try{
         const email = req.params.email;
         console.log(email)
         const  response= await employee.find().byEmail(email).populate('personaldetails');
         if(response.length === 0){
            return res.status(404).json({message : "user not fount"}); 
         }
         res.status(200).json(response);
        }catch(error){
            res.status(500).json({ message: error.message });
        }
    }
    const getbyrolequerymethod = async (req, res, next) => {
        try {
            const role= req.params.role
            const  response= await employee.find().byRole(role).populate('personaldetails');
            res.json({ response});
        } catch (error) {
            res.status(500).json({ message: "An error occurred", error });
        }
    };

module.exports ={getempbyid,getbycity,findByEmail,getbycitystaticmethod,getbycityquerymethod,getallemployees,getbyrolequerymethod,getbyusernamestaticmethod,getemployees,show,register,update,updateemployees,delete1,delete2 }