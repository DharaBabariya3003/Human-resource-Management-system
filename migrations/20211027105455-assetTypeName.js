module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    
    // Add asset types
    let assetTypesList= ['Headphones','Earphones','Bluetooth Speakers','Mobile','Tablet','Charging Adapter','Charging Cable','Aux Cable','CPU','Monitor','Keyboard','Mouse'];
    for (let element of assetTypesList) {
      await db.collection("assetTypes").insertOne({ 
        assetType: element,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0 });
    }
    
    // Add asset names
    for (let assetType of assetTypesList) {
      let assetNames=[];
       let assetTypeID = await db.collection("assetTypes").findOne({ assetType },'_id');
       if(assetType === 'Headphones'){
        assetNames= ['Fingers','Phillips','HP'];
       }else if(assetType === 'Earphones'){
        assetNames= ['Artis'];
       }else if(assetType === 'Bluetooth Speakers'){
        assetNames= ['MIVI','JBL'];
       }else if(assetType === 'Mobile'){
        assetNames= ['Redmi 9 Power','Samsung SM-A105F','Samsung J7','Vivo U20','Redmi Note 8'];
       }else if(assetType === 'Tablet'){
        assetNames= ['Apple','Samsung'];
       }else if(assetType === 'Charging Adapter'){
        assetNames= ['MI','VIVO','Samsung'];
       }else if(assetType === 'Charging Cable'){
        assetNames= ['Micro USB','Type C','Lightning(Apple)'];
       }else if(assetType === 'CPU'){
        assetNames= ['HP','Lenovo','i-Ball'];
       }else if(assetType === 'Monitor'){
        assetNames= ['AOC','Dell'];
       }else if(assetType === 'Keyboard'){
        assetNames= ['Logitech','Rapoo'];
       }else if(assetType === 'Mouse'){
        assetNames= ['Logitech','Rapoo'];
       }
       
       
      for (let element of assetNames) {
        await db.collection("assetNames").insertOne({
          assetType: assetTypeID._id,
          assetName: element,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        });
      }
    }


  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};

