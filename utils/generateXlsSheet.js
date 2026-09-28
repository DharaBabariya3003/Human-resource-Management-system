const excel = require("exceljs");

exports.createExcelSheet = async (worksheetColumns,xlsSheetObject,bottomTotalRow,xlsFileName) => {
  try {
    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("XlsSheet");
    worksheet.columns = worksheetColumns;
    
    //force the columns to be at least as long as their header row.
    worksheet.columns.forEach((column) => {
      column.width = column.header.length < 12 ? 12 : column.header.length;
    });
    // Make the header bold.
    worksheet.getRow(1).font = { bold: true };
    worksheet.addRows(xlsSheetObject);
    worksheet.addRow(bottomTotalRow);
    
    // Row style
    if(Object.keys(bottomTotalRow).length > 0){
    worksheet.getRow((xlsSheetObject.length)+2).font = { bold: true };
    }
    worksheet.eachRow(function (row, rowNumber) {
      row.eachCell((cell, colNumber) => {
        if(Object.keys(bottomTotalRow).length > 0){
          if (rowNumber == 1) {
            // First set the background of header row
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "f5b914" },
            };
          }else if (rowNumber == ((xlsSheetObject.length)+2)) {
            // First set the background of header row
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "e2b8c0" },
            };
          }
        }
        // Set border of each cell
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      //Commit the changed row to the stream
      row.commit();
    });
    workbook.xlsx
      .writeFile(`./public/downloadExcel/${xlsFileName}.xlsx`)
      .then(function () {});
  } catch (error) {
    next(error);
  }
}