const { aws } = require("../config");
const AWS = require('aws-sdk');
/**
 * Upload file on AWS
  @param {} filePath Address of file
  @param {} image image data
 */
const S3 = new AWS.S3({
  accessKeyId: aws.id,
  secretAccessKey: aws.secret,
  region: aws.s3Region
});

exports.uploadFile = async(filePath, file,fileType) => {
  try{
		let params=null;
		if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {
			params = { Bucket: aws.bucket, Key: filePath };
		}else{
			params = { Bucket: aws.bucket, Key: filePath, ContentDisposition:"inline", ContentType:"application/pdf" };
		}
  	params.Body = file instanceof Buffer ? file : file.buffer
  	return S3.upload(params).promise();
  }
  catch(error){
  }
}

exports.deleteFile = async(filePath) => {
	try{		
		let params = {  Bucket: aws.bucket, Key: filePath };

		return S3.deleteObject(params).promise();
	}catch(error){

	}
}
 /**
 * Get signed URL to access the private file
 */
exports.getSignedURL = async(key) => {
	return new Promise((resolve, reject) => {
		try {
			var keyPart = key.split("/");
			const fileName = keyPart[keyPart.length - 1];
			
			var params = {
				Bucket:aws.bucket,
				Key: key,
				Expires: 60 * 60
			};
			const signedUrl = S3.getSignedUrl('getObject', params);
			if (signedUrl) {
				return resolve({
					signedUrl,
					fileName,
				});
			} else {
				return reject("Cannot create signed URL");
			}
		} catch (err) {
			return reject("Cannot create signed URL!");
		}
	});
}

/**
* Get S3 file object buffer
@param {} filePath  Address of file
*/
exports.getObject = async (filePath) => {
  let params = { Bucket: aws.bucket, Key: filePath };
  const fileObject = await S3.getObject(params).promise();
  return fileObject.Body;
}