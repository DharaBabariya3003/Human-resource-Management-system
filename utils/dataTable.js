

/**
 * Get fetchDatatableRecords
 * @param {*} dtReq
 * @param {*} ModelObj
 * @param {*} fieldNames
 * @param {*} conditionQuery
 * @param {*} projectionQuery
 * @param {*} sortingQuery
 * @param {*} populateQuery
 * @param {*} callback
*/

exports.fetchDatatableRecords = async (dtReq, ModelObj, fieldNames, conditionQuery, projectionQuery, sortingQuery, populateQuery, callback) => {

  var searchQuery = conditionQuery;
  var drawRecord = dtReq.draw;
  var skipRecord = dtReq.start;
  var limitRecord = dtReq.length;     
    
  try {
      if (dtReq.search && dtReq.search.value && fieldNames.length > 0) {                 
          var regex = new RegExp(dtReq.search.value, "i");
          var orQueryList = [];
          for (var i = 0; i < fieldNames.length; i++) {
              var searchJson = {};
              searchJson[fieldNames[i]] = regex;
              orQueryList.push(searchJson);
          }
          searchQuery.$or = orQueryList;
      }
  } catch (err) {
      throw new Error(err);
  }

  var responseJson = {
      "draw": drawRecord,
      "recordsFiltered": 0,
      "recordsTotal": 0,
      "data": []
  };

  const totalRecordsCount = await ModelObj.countDocuments(conditionQuery);
  responseJson.recordsTotal = totalRecordsCount;

  const recordsFilteredCount = await ModelObj.countDocuments(searchQuery);
  responseJson.recordsFiltered = recordsFilteredCount;

  var recordsData;
  if (populateQuery && populateQuery.length > 0) {
      recordsData = await ModelObj.find(searchQuery, projectionQuery, { skip: Number(skipRecord), limit: Number(limitRecord), sort: sortingQuery }).populate(populateQuery);
  } else {
      recordsData = await ModelObj.find(searchQuery, projectionQuery, { skip: Number(skipRecord), limit: Number(limitRecord), sort: sortingQuery });
  }
  
  if (recordsData) {
      responseJson.data = recordsData;
      callback(null, responseJson);
  } else {
      var err = new Error('Something went wrong.', recordsData);
      callback(err, null);
  }

}

exports.fetchDatatableRecordsForPopulateData = async (dtReq, ModelObj, fieldNames, conditionQuery, projectionQuery, sortingQuery, populateQuery, callback) => {
    try {
      var searchQuery = conditionQuery;
      var drawRecord = dtReq.draw;
      var skipRecord = dtReq.start;
      var limitRecord = dtReq.length;

      var responseJson = {
        "draw": drawRecord,
        "recordsFiltered": 0,
        "recordsTotal": 0,
        "data": []
      };

      var recordsData;

      if (dtReq.search && dtReq.search.value && fieldNames.length > 0 && populateQuery) {
        var filter = [];
        let splitSearchString = dtReq.search.value.split(" ");
  
        splitSearchString.filter(subString => {
          fieldNames.map(fieldName => {
            if(subString.trim().length != 0){
            var regraxQuery = {};
            regraxQuery[fieldName] = new RegExp(subString, "i");
            filter.push(regraxQuery)
            }
          })
        })
        
        // aggregate query
        var aggregateQuery = [
          {
            $lookup:
            {
              from: `${populateQuery[0].path}s`,
              localField: populateQuery[0].path,
              foreignField: "_id",
              as: populateQuery[0].path,
            }
          },
          { $unwind: `$${populateQuery[0].path}` },
          { $match: { $or: filter, $and:[searchQuery]} },
          {
            $facet: {
              result: [
                {
                  $sort: sortingQuery
                },
                { $skip: parseInt(skipRecord) },
                { $limit: parseInt(limitRecord) }
              ],
              totalCount: [{ $count: 'total' }]
            }
          }
        ];
        
        var modelResult = await ModelObj.aggregate(aggregateQuery);
        var { result,totalCount } = modelResult[0];
        
        if(result.length == 0 || totalCount.length == 0)
        {
          recordsData = [];
          responseJson.recordsTotal = result.length;
          responseJson.recordsFiltered = totalCount.length;
        }else{
          recordsData = result;
          responseJson.recordsTotal = totalCount[0].total;
          responseJson.recordsFiltered = totalCount[0].total;
        }

      } else {
        const totalRecordsCount = await ModelObj.countDocuments(conditionQuery);
        responseJson.recordsTotal = totalRecordsCount;
  
        const recordsFilteredCount = await ModelObj.countDocuments(searchQuery);
        responseJson.recordsFiltered = recordsFilteredCount;
  
        recordsData = await ModelObj.find(searchQuery, projectionQuery, { skip: Number(skipRecord), limit: Number(limitRecord), sort: sortingQuery }).populate(populateQuery);
      }

      // return data
      if (recordsData) {
        responseJson.data = recordsData;
        callback(null, responseJson);
      } else {
        var err = new Error('Something went wrong.', recordsData);
        callback(err, null);
      }
    } catch (err) {
      throw new Error(err);
    }
}