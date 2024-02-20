const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const emppersonaldetailsschema = new Schema({
    DOB: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    phoneNo: {
        type: Number,
        required: true
    }
});

const employeeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    username: {
        type: String,
        required: true, 
        unique: true, 
        validate: {
            validator:  /^[a-zA-Z0-9_]{3,20}$/, 
            message: 'Username must be between 3 and 20 characters long and contain only letters, numbers, or underscores' 
        }
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    personaldetails: {
        type: Schema.Types.ObjectId,
        ref: "emppersonaldetails"
    }
}, {
    timestamps: true
});
function employeeSchemaPlugin(schema, options) {

    schema.index({name:1,city:-1})
    
schema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        next();
    } catch (error) {
        return next(error);
    }
});

schema.statics.findByusername = function(username) {
    return this.findOne({ username: username });
}
schema.statics.findbycity = async function(city) {
    const employees = await this.find().populate('personaldetails','city');
    const employeesInCity = employees.filter(item => item.personaldetails.city === city);
    return employeesInCity;
};
schema.virtual('pen').get(function() {
    return this.name + ' ' + this.email;
});

schema.query.byRole = function(role) {
    return this.where({ role });
};

schema.query.bycity = async function(city) {
    const employees = await this.find().populate('personaldetails','city');
    const employeesInCity = employees.filter(item => item.personaldetails.city === city);
    return employeesInCity;
};

schema.query.byEmail = function(email) {
    return this.where({ email });
}
    
}
employeeSchema.plugin(employeeSchemaPlugin);

const personaldetails = mongoose.model('emppersonaldetails', emppersonaldetailsschema);
const employee = mongoose.model('Employee', employeeSchema);



module.exports = { employee, personaldetails };