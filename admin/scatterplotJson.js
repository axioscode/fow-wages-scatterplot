var xlsx = require('node-xlsx');
var fs = require("fs");
var _ = require('lodash');
var request = require("request");
var async = require("async");

var storeAnnual = {};
var theIndustries = {}; //Empty global object to build our javascript object.
var monthsArray = [];
var monthsObj = {};


const sectorLookup = {
  "11": "Agriculture, Forestry, Fishing and Hunting",
  "21": "Mining, Quarrying, and Oil and Gas Extraction",
  "22": "Utilities",
  "23": "Construction",
  "31": "Manufacturing",
  "32": "Manufacturing",
  "33": "Manufacturing",
  "42": "Wholesale Trade",
  "44": "Retail Trade",
  "45": "Retail Trade",
  "48": "Transportation and Warehousing",
  "49": "Transportation and Warehousing",
  "51": "Information",
  "52": "Finance and Insurance",
  "53": "Real Estate and Rental and Leasing",
  "54": "Professional, Scientific, and Technical Services",
  "55": "Management of Companies and Enterprises",
  "56": "Administrative and Support and Waste Management and Remediation Services",
  "61": "Educational Services",
  "62": "Health Care and Social Assistance",
  "71": "Arts, Entertainment, and Recreation",
  "72": "Accommodation and Food Services",
  "81": "Other Services (except Public Administration)",
  "92": "Public Administration",
  "PART 238" : "Specialty Trade Contractors",
  "-" : "Federal, State or Local Government (no wage data available)"
};

var setData = {
    init: function(data) {

        //Recast data as an object array with column headers as keys.
        data = toObjectArray(data);

        //Create months array
        for (let yr = 2002; yr <= 2017; yr++) {
            for (let mo = 1; mo <= 12; mo++) {
                let str = `${yr}${pad(mo,2)}`;
                monthsArray.push(str);
                monthsObj[str] = [];
            }
        }

        data.forEach((d, i) => {

            let id = d["industry"];

            let sectorKey = "";
            if (d.naics === "PART 238") {
                sectorKey = "PART 238";
                
            } else {
                sectorKey = String(d.naics).substring(0,2);
            }

            sector = sectorLookup[sectorKey];
            theIndustries[id] = {
                industry_name: d["industry_name"],
                projected: d["projected"],
                sector: sectorLookup[sectorKey],
                sectorKey : sectorKey
            }

            storeAnnual[id] = {};

            monthsArray.forEach(m => {

                let yearAgo = getYearAgo(m);
                storeAnnual[id][m] = d[`emp${m}`] ? d[`emp${m}`] : null;

                let obj = {
                    id : id,
                    yrAgo : storeAnnual[id][yearAgo] ? storeAnnual[id][yearAgo] : null,
                    emp  : d[`emp${m}`] ? d[`emp${m}`] : null,
                    wage : d[`wage${m}`] ? d[`wage${m}`] : null
                }
                
                if (obj.emp && obj.wage && obj.yrAgo) {
                    monthsObj[m].push(obj);
                }
                
            
            });



        });


        function getYearAgo(mo) {
            let yr = Number(mo.substring(0,4)) - 1;
            let month = mo.substring(4,6);
            return `${yr}${month}`;
        }



        writeFile();

    }
}


function getWageCat(id, i) {

    let cats = Object.keys(wageCats);

    let val = null;

    cats.forEach(c=> {
        if (wageCats[c].indexOf(id) > -1) {
            val = c;
        }
    });

    return val;

}



function splitKey(k) {
    let cat, month;

    if (k.indexOf("emp") > -1) {
        cat = "emp";
        month = k.split("emp")[1];
    } else if (k.indexOf("wage") > -1) {
        cat = "wage";
        month = k.split("wage")[1];
    }

    return {
        "month": month,
        "cat": cat
    };
}




function writeFile() {

    //Stringify `theIndustries` object
    var theLookup = JSON.stringify(theIndustries);

    //...and write it to an output.json file. (or whatever you want to call it)
    fs.writeFile("../src/data/industryLookup.json", theLookup, function(err) {
        if (err) return console.log(err);
        console.log('Success: industryLookup.json');
    });



    //Stringify `theMonths` object
    var theMonths = JSON.stringify(monthsObj);

    //...and write it to an output.json file. (or whatever you want to call it)
    fs.writeFile("../src/data/monthsData.json", theMonths, function(err) {
        if (err) return console.log(err);
        console.log('Success: monthsData.json');
        console.log('You are a bright and shining star.');
    });



}




async.series(
    [

        function(callback) {

            var data = xlsx.parse('indeed_bls_data_12-8-2017.xlsx'); //The data
            callback(null, data);

        }
    ],
    function(err, results) {

        // * Because we're using async, results is an array. so the first file is in `results[0]`, the second in `results[1]`, etc...
        // * Each results has two objects: `name` (the worksheet name) and `data`.

        var data = results[0][0].data;

        setData.init(data);

    }
)




//Returns an array of objects with the column names as keys.
function toObjectArray(origArray) {

    var newArray = [];
    for (var index = 1; index < origArray.length; index++) {
        newArray.push(_.zipObject(origArray[0], origArray[index]));
    }

    return newArray;

}


function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


const numberFormat = {
    rounded: function(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    },
    commas: function(val) {
        while (/(\d+)(\d{3})/.test(val.toString())) {
            val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
        }
        return val;
    },
    percent: function(val) {
        return numberFormat.rounded(val * 100, 2).toFixed(2);
    },
    dollars: function(val) {
        return `$${numberFormat.commas(val)}`;
    }
}







const wageCats = {
    missing: ["CES4348200001", "CES4348300001", "CES4348700001", "CES5552100001", "CES5553300001", "CES6561000001", "CES9091100001", "CES9091912001", "CES9092161101", "CES9092200001", "CES9093161101", "CES9093200001"],
    low: ["CES5553200001", "CES3232600001", "CES8081100001", "CES3133700001", "CES6562160001", "CES4349200001", "CES6562420001", "CES4349300001", "CES4244200001", "CES6056140001", "CES3231100001", "CES3132100001", "CES3231300001", "CES6056130001", "CES4244130001", "CES4348500001", "CES6562310001", "CES4244400001", "CES3231500001", "CES6562390001", "CES4245300001", "CES6056160001", "CES3231400001", "CES7071300001", "CES6562410001", "CES7072100001", "CES8081200001", "CES6056170001", "CES6562320001", "CES6562330001", "CES4244800001", "CES6562430001", "CES4245100001", "CES6562440001", "CES4244500001", "CES4245210001", "CES4245290001", "CES4244700001", "CES7072200001"],
    middle: ["CES6562140001", "CES6054120001", "CES4142300001", "CES5552220001", "CES2023700001", "CES3133300001", "CES5552210001", "CES2023800101", "CES2023800201", "CES6562130001", "CES3232200001", "CES3133100001", "CES8081300001", "CES6054190001", "CES3133900001", "CES4142400001", "CES6056200001", "CES3133500001", "CES5552230001", "CES4348800001", "CES2023610001", "CES1021230001", "CES6056150001", "CES4245400001", "CES4244300001", "CES4244110001", "CES5553100001", "CES6056190001", "CES4244600001", "CES4348400001", "CES3232900001", "CES6056120001", "CES3133200001", "CES3232300001", "CES7071200001", "CES3132700001", "CES6562190001", "CES1011330001", "CES4244120001"],
    high: ["CES6054170001", "CES5552300001", "CES6054150001", "CES6054110001", "CES5051900001", "CES4348600001", "CES3133410001", "CES6054160001", "CES1021100001", "CES3133420001", "CES6562110001", "CES6054130001", "CES6054180001", "CES5051100001", "CES3232400001", "CES6055000001", "CES3133450001", "CES4422000001", "CES4142500001", "CES3133460001", "CES6056110001", "CES5051800001", "CES5552400001", "CES3133440001", "CES1021220001", "CES5051700001", "CES2023620001", "CES5051500001", "CES6054140001", "CES1021210001", "CES3133600001", "CES6562120001", "CES4348100001", "CES6562200001", "CES5051200001", "CES3232500001", "CES7071100001", "CES6562150001", "CES1021300001"]
}





