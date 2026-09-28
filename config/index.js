module.exports = {
  dbUri : process.env.DB_URI,
  
  jwtSecret : process.env.JWT_SECRET,

  swageerOptions: {
    swaggerOptions: {
      defaultModelsExpandDepth: 0,
    },
  },
  bcrypt: {
    salt: process.env.SALT,
  },
  port: {
    portAddress: process.env.PORT
  },
  secretKeys: {
    jwt: process.env.JWT
  },
  sessionSecretKey:{
    secret:process.env.SECRET
  },
  gmailKey:{
    emailId:process.env.EMAILID,
    emailPsw:process.env.EMAILPSW
  },
  aws: {
    id       : process.env.AWS_ID,
    secret   : process.env.AWS_SECRET,
    s3Region : process.env.AWS_S3_REGION,
    bucket   : process.env.AWS_BUCKET,
  },
  sendGridKey:{
    api_key : process.env.SENDGRID_KEY,
  },
  emailID : process.env.EMAILID,
  baseUrl: process.env.BASEURL,
  redisConfig:{
    redis_host : process.env.REDISHOST,
    redis_port : process.env.REDISPORT,
  },
  hostUrl: process.env.HOSTURL,
  organizationAccountNumber: process.env.ACCOUNTNUMBER,
  tdsAmount: process.env.TDS_AMOUNT,
  airbrakeConfig: {
    projectId: process.env.AIRBRAKE_PROJECTID,
    projectKey: process.env.AIRBRAKE_PROJECTKEY
  }
}
