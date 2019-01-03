module.exports = {
    mail:{
        from:'surveliancelazzahome@gmail.com',
        to:['surveliancelazzahome@gmail.com','vale.penna79@gmail.com'],
        account:{
            service: 'gmail',
            auth: {
                user: 'surveliancelazzahome@gmail.com',
                pass: 'surveliance2015.'
            }
        }

    },

    cameras:[{ 
              xaddr: 'http://192.168.1.32:888/onvif/device_service',
              name:'Garage esterno',
              user : 'admin',
              pass : 'admin2016'
            },
            { 
              xaddr: 'http://192.168.1.40:888/onvif/device_service',
              name:'Ingresso',
              user : 'admin',
              pass : 'admin2016'
            }
			,
            { 
              xaddr: 'http://192.168.1.36:888/onvif/device_service',
              name:'Garage interno',
              user : 'admin',
              pass : 'admin2016'
            }]
    };