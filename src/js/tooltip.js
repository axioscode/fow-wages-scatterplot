// let util = require('./util.js')
const d3 = require("d3");

let getQuad = (coords, size) => {

    let l = []

    if (coords[1] > size[1] / 2) {
        l.push('s')
    } else {
        l.push('n')
    }

    if (coords[0] > size[0] / 2) {
        l.push('e');
    }

    if (coords[0] < size[0] / 2) {
        l.push('w');
    }

    return l.join('');

}


function numberWithCommas(val) {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

let pctFormat = d3.format(".1%");
let parseTime = d3.timeParse("%Y%m");
let formatDate = d3.timeFormat("%b %y");

let init = function(ttDiv) {

    let theTooltip = d3.select(ttDiv).select('.tooltip')
    let fields = theTooltip.selectAll('.tt-update')

    let updateFields = function(data) {
        fields.each(function() {
            let f = d3.select(this)
            let o = this.dataset
            if (o.format) {
                f.text(formats[o.format](data[o.field]))
            } else {
                f.text(data[o.field])
            }
        });
    }

    let position = function(data, coords, size) {

        let region = getQuad(coords, size)

        theTooltip
            .classed('tooltip-active', true)
            .classed('tooltip-' + region, true)
            .style('left', coords[0] + 'px')
            .style('top', coords[1] + 'px')
            .html(d => {

                let projStr = data.lookup.projected >= 0 ? `+${pctFormat(data.lookup.projected)}` : pctFormat(data.lookup.projected);

                let wage = `$${data.wage}/hr`; 
                let emp =  data.emp < 1000 ? `${round(data.emp, 2)}k` : `${round(data.emp/1000, 2)}m`; 

                let month = formatDate(parseTime(data.m));

                return `<div class="tooltip-inner">
							<div class="close-button">×</div>
							<h4 class="tt-header">${data.lookup.industry_name}</h4>
							<div class="tt-row with-rule subhead">${data.sector}</div>
							<div class="tt-row with-rule">
								<strong>Proj. 2014-24</strong>
								<span>${projStr}</span>
							</div>
                            <div class="tt-row with-rule">
                                <strong>Employed ${month}</strong>
                                <span>${emp}</span>
                            </div>
                            <div class="tt-row">
                                <strong>Avg wage</strong>
                                <span>${wage}</span>
                            </div>
						</div>`
            });



    }

    let deposition = function() {

        theTooltip.attr('class', 'tooltip')

    }

    return {
        position,
        deposition,
        updateFields
    }
}

module.exports = {
    init
}