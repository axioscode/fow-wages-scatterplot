let d3 = require("d3");
let setTooltip = require('./tooltip.js');



class scatterplot {

    constructor(opts) {
        this.element = opts.element;
        this.aspectHeight = opts.aspectHeight ? opts.aspectHeight : .7;
        this.onReady = opts.onReady ? opts.onReady : null;
        this.data = opts.data ? opts.data : null;
        this.lookup = opts.lookup ? opts.lookup : null;
        this.currCat = opts.currCat;

        this.parseTime = d3.timeParse("%Y%m");
        this.formatTime = d3.timeFormat("%Y");
        this.pctFormat = d3.format(".0%");

        this.index = 0;

        this._setData();
        this.update();

    }


    _setData() {
        this.series = [];

        this.industries = Object.keys(this.lookup);

        this.industries.forEach(ind => {
            this.lookup[ind].lineArray = [];
        });

        this.months = Object.keys(this.data).filter(m => {
            return this.data[m].length > 0;
        })

        this.months.forEach(m => {
            let arr = this.data[m];

            arr.forEach(d => {
                d.annualized = (d.emp - d.yrAgo) / d.yrAgo;
            });

            this.series.push(arr);
        });

        this.series = this.series.filter(d => {
            return d.length > 0;
        });

        this.series.forEach(s => {
            s.forEach(d => {
                this.lookup[d.id].lineArray.push(d);
            });
        });


    }

    _setDimensions() {
        // define width, height and margin

        this.margin = {
            top: 0,
            right: 15,
            bottom: 45,
            left: 45
        };

        this.width = this.element.offsetWidth - this.margin.left - this.margin.right;
        this.height = (this.element.offsetWidth * this.aspectHeight) - this.margin.top - this.margin.bottom; //Determine desired height here

    }


    _setScales() {

        // this.percColor = d3.scaleLinear()
        //     // .domain([-0.4557863, 0, 0.6024402])
        //     .domain([-.5, 0, .5])
        //     .range(['#ff7921', '#008dc8', '#01356e'])

        this.percColor = d3.scaleThreshold()
            .domain([0])
            .range(['#ff6602', '#551bb7'])


        let wageColors = {
            "high": "#027bb9",
            "middle": "#846f55",
            "low": "#b1290a"
        }

        this.colorByWage = function(d) {
            let cat = this.lookup[d.id].wageCat;
            return wageColors[cat] ? wageColors[cat] : "#999";
        }

        this.circleScale = d3.scaleSqrt()
            .range([5, 50]);

        this.circleScale.domain([
            d3.min(this.series, function(c) {
                return d3.min(c, function(d) {
                    return d.emp;
                });
            }),
            d3.max(this.series, function(c) {
                return d3.max(c, function(d) {
                    return d.emp;
                });
            })
        ]);

        this.xScale = d3.scaleLinear()
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .range([this.height, 0]);

        this.yScale.domain([
            d3.min(this.series, function(c) {
                return d3.min(c, function(d) {
                    return d.annualized;
                });
            }),
            d3.max(this.series, function(c) {
                return d3.max(c, function(d) {
                    return d.annualized;
                });
            })
        ]);

        this.xScale.domain([
            d3.min(this.series, function(c) {
                return d3.min(c, function(d) {
                    return d.wage;
                });
            }),
            d3.max(this.series, function(c) {
                return d3.max(c, function(d) {
                    return d.wage;
                });
            })
        ]);

        this.yAxis = d3.axisLeft(this.yScale)
            .tickFormat(d => {
                return d > 0 ? `+${this.pctFormat(d)}` : this.pctFormat(d);
            })
            .tickSize(-this.width)
            .ticks(5);

        this.xAxis = d3.axisBottom(this.xScale)
            .tickSize(-this.height)
            .tickFormat(d => {
                let str = `$${d}`;
                return str;
            });


        this.line = d3.line()
            .curve(d3.curveCardinal)
            .x(d => {
                return this.xScale(d.wage)
            })
            .y(d => {
                return this.yScale(d.annualized)
            });

        this.trendLine = d3.line()
            .x(d => {
                return d.x;
            })
            .y(d => {
                return d.y;
            });


        this.circleKey = d3.select(".circle-key")
            .style("left", `${this.margin.left + this.xScale(37)}px`)
            .style("top", `${this.margin.top + this.yScale(-.15)}px`)

    }

    update() {
        this._setDimensions();
        this._setScales();
        this.draw();
    }

    draw() {

        // set up parent element and SVG
        this.element.innerHTML = "";

        d3.select(this.element).classed(this.currCat, true);

        this.tt = d3.select(this.element).append("div").classed("tooltip", true);

        this.setTooltip = setTooltip.init('.has-tooltip')

        this.svg = d3.select(this.element).append('svg');

        //Set svg dimensions
        this.svg.attr('width', this.width + this.margin.left + this.margin.right);
        this.svg.attr('height', this.height + this.margin.top + this.margin.bottom);

        // create the chart group.
        this.plot = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
            .attr("class", "chart-g");

        this.tt = d3.select(this.element).append("div")
            .classed("tt", true)
            .style("left", `${this.margin.left + 15}px`)
            .style("bottom", `${this.margin.bottom + 15}px`)
            .html("I am a the name of a job. Maybe long.")

        this.plot.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.xAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("y", 20)
            .attr("x", this.width / 2)
            .attr("text-anchor", "middle")
            .attr("dy", "0.71em")
            .text("Average hourly wage");

        this.plot.append("g")
            .attr("class", "axis y-axis")
            .call(this.yAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -this.margin.left)
            .attr("x", -this.height / 2)
            .attr("text-anchor", "middle")
            .attr("dy", "0.71em")
            .text("1yr change in employment");

        this.zeroLine = this.plot.append("line")
            .attr("class", "zero-line")
            .attr("x1", 0)
            .attr("x2", this.width)
            .attr("y1", this.yScale(0))
            .attr("y2", this.yScale(0));

        this.dots = this.plot.append("g")
            .attr("class", "dots-g");

        this.tracks = this.plot.append("g")
            .attr("class", "tracks-g");

        this.jobTracks = this.tracks.selectAll(`.line`)
            .data(this.series[this.index], d => {
                return d.id;
            })
            .enter()
            .append("path")
            .attr("class", d => {
                return `${this.lookup[d.id].wageCat} line`;
            })
            .style("stroke-width", 1)
            .style("fill", "none")

        // this.jobTracks
        //     .attr("d", d => {
        //         let arr = this.lookup[d.id].lineArray;
        //         let pts = [arr[0], arr[arr.length - 1]];
        //         return this.line(pts);
        //     });

        this.updateDots();

    }



    updateDots(slider) {

        let _this = this;

        let dur = slider ? 50 : 200;

        this.t = d3.transition()
            .ease(d3.easeLinear)
            .duration(dur);

        this.dots.moveToFront();

        this.jobs = this.dots.selectAll(`.dot`)
            .data(this.series[this.index], d => {
                return d.id;
            });

        this.jobs.enter()
            .append("circle")
            .attr("class", d => {
                return `${this.lookup[d.id].wageCat} dot`;
            })
            .attr("cx", d => {
                return this.xScale(d.wage);
            })
            .attr("cy", d => {
                return this.yScale(d.annualized);
            })
            .attr("r", d => {
                return this.circleScale(d.emp / Math.PI);
            });

        this.updateCat();

        this.jobs.exit().remove();

        this.jobs.transition(this.t)
            .each(d => {
                d.xPos = this.xScale(d.wage);
                d.yPos = this.yScale(d.annualized);
            })
            .attr("cx", d => {
                return d.xPos;
            })
            .attr("cy", d => {
                return d.yPos;
            })
            .attr("r", d => {
                return this.circleScale(d.emp / Math.PI);
            });

        this.jobs.on("mouseover", d => {

                let xPos = d.xPos + this.margin.left;
                let yPos = d.yPos + this.margin.top;

                d.lookup = this.lookup[d.id];

                this.setTooltip.position(
                    d, [d.xPos + this.margin.left, d.yPos + this.margin.top], [this.width, this.height]
                )

                //theNode.classed('is-focus',true).raise()
            })
            .on("mouseout", d => {
                this.setTooltip.deposition();
            })

        // this.jobTracks.attr("d", d => {
        //         let arr = this.lookup[d.id].lineArray.slice(0, this.index);
        //         return this.line(arr);
        //     })


        


    }


    updateCat() {

        d3.selectAll(".key").classed("active", false);

        if (this.currCat === "wages") {
            d3.select(".key.wage-key").classed("active", true);
        } else if (this.currCat === "projections") {
            d3.select(".key.projection-key").classed("active", true);
        }


        this.jobs.attr("fill", d => {
            let val = this.lookup[d.id].projected ? this.lookup[d.id].projected : null;

            if (this.currCat === "wages") {
                return this.colorByWage(d);
            } else if (this.currCat === "projections") {
                return this.percColor(val);
            }

            
        });

    }




}


/* HELPER FUNCTIONS */
//Move to front and back controls z-index of features on mouseover and mouseout.
d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        const firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};




export default scatterplot;