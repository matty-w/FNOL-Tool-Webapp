import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

const { read, utils: { sheet_to_json } } = XLSX;
type AOA = any[][];

@Component({
  selector: 'app-fnol-page',
  templateUrl: './fnol-page.component.html',
  styleUrls: ['./fnol-page.component.css']
})
export class FnolPageComponent
{
  showLoadingDiv = false;
  deviceReportDetails: any[][] = new Array();
  faultyListFull: any[][] = new Array();

  fnolFiles : File[] = new Array();

  file : File;
  data: AOA = [[1,2],[3,4]]
  arrayBuffer : any[][];
  fileName : string = "test.xlsx";
  cellValues : any[][];
  rows: number;
  claimsFile : File;
  deviceReport : File;
  deviceReportText : any;
  JSONData : any;

  claimsFileRowValue : any[] = new Array();
  claimsFileTotalValues : any[][] = new Array();
  fnolListFull : any[][] = new Array();

  fnolTitles : string[] = new Array();

  claimsReader : FileReader;

  rowValues : any[];

  fnolRowValues : string[] = ["Store telephone number","Collision time","Collision date","Collision causation code","sopp+sopp Reference number"];
  


  public base64Files: string[] = new Array();
  fileReader = new FileReader();


  readMultipleFiles(event)
  {
    const files = event.target.files;
    Object.keys(files).forEach(i => 
      {
        const file = files[i];
        var fileName = files[i].name;
    
        
        
        const reader = new FileReader();
        reader.onload = (e: any) => 
        {
          var filteredFnolData: any[] = new Array();
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
    
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];
    
          this.data = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
    
         

          let dataRow = this.data[101];
          let expectedResult = dataRow[0];
          if(expectedResult !== "Driver Trainer Email Address")
          {
            let faultyFnolDetails : any[] = new Array();
            let reason : string = "";
            if(expectedResult === "")
            {
              reason = "FNOL Is Too Short To Accurately Mine For Results. Check File Manually";
              faultyFnolDetails.push(fileName);
              faultyFnolDetails.push(reason);
              this.faultyListFull.push(faultyFnolDetails);
            }
            else
            {
              reason = "FNOL Is Too Long To Accurately Mine For Results. Check File Manually";
              faultyFnolDetails.push(fileName);
              faultyFnolDetails.push(reason);
              this.faultyListFull.push(faultyFnolDetails);
            }
            return;
          }

          filteredFnolData = this.getRequiredFnolValues(this.data, fileName);
         

          this.fnolListFull.push(filteredFnolData);
          
      
        }
        reader.readAsBinaryString(file);
      })
      this.enableSubmit();

  }

  enableSubmit()
  {
    var messages = document.forms["FnolForm"]["messages"].value;
    var claims = document.forms["FnolForm"]["excelFolder"].value;
    var device = document.forms["FnolForm"]["deviceReport"].value;


    if(messages === null || messages === "" || claims === null || claims === "" || device === null || device === "")
    {
      var button = <HTMLInputElement>document.getElementById("fnolSubmit");
      button.disabled = true;
    }
    else
    {
      var button = <HTMLInputElement>document.getElementById("fnolSubmit");
      button.disabled = false;
    }
  }

  calculateDeviceId(sheetData : AOA) : string
  {
    return "";
  }

  writeXmlFile()
  {
    let date: Date = new Date();

    let fullDate : string = date.toLocaleString();

    let dateTrim = fullDate.replace(/\s/g, "");
    let dateReplace = dateTrim.replace(/,/, "_");
    let dateReplace2 = dateReplace.replace(/\//g, "-");
    let dateReplace3 = dateReplace2.replace(/:/g, "-");
 

    let name = "FNOL_DATA"+"_"+dateReplace3;

    var wscols = [
      {wch:24},
      {wch:16},
      {wch:0},
      {wch:20},
      {wch:20},
      {wch:0},
      {wch:28},
      {wch:50},
      {wch:80}
     ];

    var wscols2 = [
      {wch: 50},
      {wch: 50}
    ]; 

     if(this.faultyListFull.length === 0)
     {
      var data = this.createDataForSheet();
      var ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = wscols;
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,ws, "FNOL Data");
      XLSX.writeFile(wb, name+".xlsx", {cellStyles:true});
     }
     else
     {
      var data = this.createDataForSheet();
      var faultyData = this.createFaultyDataForSheet();
      var ws = XLSX.utils.json_to_sheet(data);
      var ws2 = XLSX.utils.json_to_sheet(faultyData);
      ws['!cols'] = wscols;
      ws2['!cols'] = wscols2;
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,ws, "FNOL Data");
      XLSX.utils.book_append_sheet(wb,ws2, "Problem FNOLs");
      XLSX.writeFile(wb, name+".xlsx", {cellStyles:true});
     }
  }

  createFaultyDataForSheet()
  {
    var errDataFull = [];
    

    return errDataFull;
  }

  createDataForSheet()
  {  
     var dataFull = [];
     for(let i = 0; i < this.fnolListFull.length; i++)
     {
      let deviceId = this.getDeviceId(this.fnolListFull[i][0]);
      let checkIfInClaimsFile = this.checkClaimsFileForEntry(this.fnolListFull[i][4]);
      var data = {"VRN" : this.fnolListFull[i][0], "Device ID":deviceId, "":"", "Collision Date":this.fnolListFull[i][2], "Collision Time":this.fnolListFull[i][1], " ":"",  
                  "Sopp + Sopp Reference Number":this.fnolListFull[i][4], "Collision Causation Code":this.fnolListFull[i][3], "File Name":this.fnolListFull[i][5], 
                  "Already In Claims File":checkIfInClaimsFile};
      dataFull.push(data);
     }
    
     return dataFull;
  }

  checkClaimsFileForEntry(SASRefNumber : string)
  {
    var length : number = this.claimsFileTotalValues.length-1;

    for(let i = 0; i < length; i++)
    {
      if(SASRefNumber === this.claimsFileTotalValues[i][2])
      {
        return "TRUE";
      }
    }
    return "FALSE";
  }

  getDeviceId(vehicleReg : string) : string
  {
    let incomingReg = vehicleReg.replace(/\s/g, "");
    var length : number = this.deviceReportDetails.length-1;

    for(let i = 0; i < length; i++)
    {
      let dataRow =  this.deviceReportDetails[i];
      let regId : string = dataRow[3];
      let regIdNoSpace = regId.replace(/\s/g, "");
      if(incomingReg === regIdNoSpace)
      {
        let deviceId = dataRow[0];
        return deviceId;
      }
    }
    return "No Device ID Found";
    
  }

  incomingFile(event)
  {
    this.file = event.target.files[0];
  }

  onClaimsChange(event)
  {
    this.claimsFile = event.target.files[0];

  }

  createFile()
  {

  }

  getDeviceReportData(event)
  {
    const fileToRead = event.target.files[0];

    let fileReader = new FileReader();

    fileReader.readAsText(fileToRead);
    

    fileReader.onload = (e) =>
    {
      let text = fileReader.result;
      this.deviceReportText = text;
      
      

      var lines = this.deviceReportText.split("\n");
      
      var num: number = lines.length;

      for(let i = 7; i < num; i++)
      {
      
        var result = [];
        var currentLine = lines[i].split(",");
        result = currentLine;
        this.deviceReportDetails.push(result);
      }
   
      this.enableSubmit();
    }
  }

  getClaimsData(evt: any)
  {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    let fileReader = new FileReader();
    this.showLoadingDiv = true;
    
    fileReader.onload = (e: any) => 
    {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

      const wsname: string = wb.SheetNames[6];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      this.data = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));

      this.getRequiredValues(this.data);
    }
    fileReader.readAsBinaryString(target.files[0]);   
    this.enableSubmit();
  }

  getRequiredFnolValues(sheetData: AOA, fileName: string) : any[]
  {
    var fnolDataList : any[] = new Array();
    this.rows = sheetData.length;

    for(let i = 1; i < sheetData.length; i++)
    {
      this.fnolRowValues = sheetData[i];
      var fnolTitleCell = this.fnolRowValues[0];
      var fnolData = this.fnolRowValues[1];

      if(fnolTitleCell === "Tesco vehicle registration number" || fnolTitleCell === "Collision time" ||
         fnolTitleCell === "Collision date" || fnolTitleCell === "Collision causation code" ||fnolTitleCell === "sopp+sopp Reference number ")
      {
        fnolDataList.push(fnolData);
      }
     }
     fnolDataList.push(fileName);

     return fnolDataList;
  }

  getRequiredValues(sheetData: AOA)
  {
    this.rows = sheetData.length;
    this.rowValues = sheetData[5869]

    for(let i = 9; i < sheetData.length; i++)
    {
      this.rowValues = sheetData[i];
      var regValue  = this.rowValues[0];
      var deviceId  = this.rowValues[1];
      var SASRef = this.rowValues[2];

      if(regValue === "" || regValue === null || regValue === undefined)
      {
        continue;
      }

      if((deviceId === "" || deviceId === null || deviceId === undefined))
      {
        continue;
      }
      else
      {
        this.claimsFileRowValue.push(regValue);
        this.claimsFileRowValue.push(deviceId);
        this.claimsFileRowValue.push(SASRef);
        this.claimsFileTotalValues.push(this.claimsFileRowValue);
        this.claimsFileRowValue = [];
      }
    }

   

  }

  getRowValues(worksheet: XLSX.WorkSheet)
  {
    var headers = [];
    var range = XLSX.utils.decode_range(worksheet['!ref']);
    var C, R = range.s.r;
    for(C = range.s.c; C <= range.e.c; ++C)
    {
      var cell = worksheet[XLSX.utils.encode_cell({c:C, r:R})];
      var hdr = "UNKNOWN "+ C;
      if(cell && cell.t) hdr = XLSX.utils.format_cell(cell);
      headers.push(hdr);
    }
    return headers;
  }

  export() : void
  {
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(this.data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

		XLSX.writeFile(wb, this.fileName);
  }



  readFile(data: any, options: XLSX.ParsingOptions) : any[][]
  {
    const wb: XLSX.WorkBook = read(data, options);
    const ws: XLSX.WorkSheet = wb.Sheets[wb.SheetNames[0]];
    return sheet_to_json({ header: 1, raw: true});
  }

}
