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

        this.isMobile = window.innerWidth <= 375 ? true : false;
        this.aspectHeight = this.isMobile ? 1.2 : this.aspectHeight;
        this.scaleFactor = this.isMobile ? .5 : 1;

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

        //this.yScale.domain([-.1, .1])

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
            .attr("y2", this.yScale(0))

        this.plot.append("text")
            .attr("class", "range-label")
            .attr("y", this.yScale(.01))
            .attr("x", this.width)
            .attr("text-anchor", "end")
            .text("Growing ↑");

        this.plot.append("text")
            .attr("class", "range-label")
            .attr("y", this.yScale(-.02))
            .attr("x", this.width)
            .attr("text-anchor", "end")
            .text("Shrinking ↓");

        this.keyDiv = d3.selectAll(".circle-key")
            .style("right", `${this.margin.right + 30}px`)
            .style("bottom", `25%`)

        d3.select(".circle-key.desktop").classed("active", !this.isMobile);
        d3.select(".circle-key.mobile").classed("active", this.isMobile);
   
        this.dots = this.plot.append("g")
            .attr("class", "dots-g");

        this.tracks = this.plot.append("g")
            .attr("class", "tracks-g");

        this.jobTracks = this.tracks.selectAll(`.track`)
            .data(this.series[this.index], d => {
                return d.id;
            })
            .enter()
            .append("path")
            .each(d=> {
                d.sector = this.lookup[d.id].sector;
            })
            .attr("class", d => {
                return `${this.lookup[d.id].wageCat} track`;
            })
            .style("stroke-width", 2)
            .style("fill", "none");

        this.jobTracks
            .attr("d", d => {
                let arr = this.lookup[d.id].lineArray;
                let pts = [arr[0], arr[arr.length - 1]];
                return this.line(arr);
            })
            .style("stroke", d => {
                let val = this.lookup[d.id].projected ? this.lookup[d.id].projected : null;

                if (this.currCat === "wages") {
                    return this.colorByWage(d);
                } else if (this.currCat === "projections") {
                    return this.percColor(val);
                }
            });

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
                d.sector = this.lookup[d.id].sector;
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
                return this.circleScale(d.emp / Math.PI) * this.scaleFactor;
            })
            .attr("fill", d => {
                let val = this.lookup[d.id].projected ? this.lookup[d.id].projected : null;

                if (this.currCat === "wages") {
                    return this.colorByWage(d);
                } else if (this.currCat === "projections") {
                    return this.percColor(val);
                }
            });

        //this.updateCat();

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
                return this.circleScale(d.emp / Math.PI)  * this.scaleFactor;
            });

        this.jobs.on("mouseover", function(d) {
                let xPos = d.xPos + _this.margin.left;
                let yPos = d.yPos + _this.margin.top;

                d.lookup = _this.lookup[d.id];

                _this.setTooltip.position(
                    d, [d.xPos + _this.margin.left, d.yPos + _this.margin.top], [_this.width, _this.height]
                );

                d3.select(this).raise();


            })
            .on("mouseout", function(d) {
                _this.setTooltip.deposition();
                d3.select(this).lower();
            })

        // this.jobs.on("click", d=> {
        //         console.log(d);
        //     });

        this.jobs.on("click", function(d) {

            console.log(d);

            let sel = d3.select(this);
            _this.highlight(sel, d.id);
        });

    }



    highlight(sel, id) {

        if (id) {
            this.jobs.classed("inactive", true).classed("active", false);
            sel.classed("inactive", false).classed("active", true);

            this.jobTracks.classed("active", false);
            let activeTrack = this.jobTracks.filter(t => {
                    return t.sector === id;
                })
                .classed("active", true);

            d3.select("button.clear").classed("active", true);
            d3.select("#state-select").property('value', id);
        } else {
            this.jobs.classed("inactive", false).classed("active", false);
            this.jobTracks.classed("active", false);
            d3.select("button.clear").classed("active", false);
            d3.select("#state-select").property('value', 'default');
        }


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


        this.jobTracks
            .style("stroke", d => {
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