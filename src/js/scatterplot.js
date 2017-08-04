let d3 = require("d3");
let setTooltip = require('./tooltip.js');
let trackEvent = require('./analytics.js').trackEvent;



class scatterplot {

    constructor(opts) {
        this.element = opts.element;
        this.aspectHeight = opts.aspectHeight ? opts.aspectHeight : .7;
        this.data = opts.data ? opts.data : null;
        this.lookup = opts.lookup ? opts.lookup : null;
        this.currCat = opts.currCat;
        this.onReady = opts.onReady;

        this.parseTime = d3.timeParse("%Y%m");
        this.formatTime = d3.timeFormat("%Y");
        this.pctFormat = d3.format(".0%");

        this.ttLive = false;
        this.highlightOn = false;


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
                d.m = m;
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
        this.aspectHeight = this.isMobile ? 1 : this.aspectHeight;
        this.scaleFactor = this.isMobile ? .5 : 1;

        this.margin = {
            top: 0,
            right: 15,
            bottom: 40,
            left: 45
        };

        this.width = this.element.offsetWidth - this.margin.left - this.margin.right;
        this.height = (this.element.offsetWidth * this.aspectHeight) - this.margin.top - this.margin.bottom; //Determine desired height here

        d3.select(".container").classed("mobile", this.isMobile);

    }


    _setScales() {

        this.percColor = d3.scaleLinear()
            // .domain([-0.4557863, 0, 0.6024402])
            .domain([-.2, 0, .2])
            .range(['#ff7921', '#CCC', '#551bb7'])

        // this.percColor = d3.scaleThreshold()
        //     .domain([0])
        //     .range(['#ff6602', '#551bb7'])

        this.threshold = d3.scaleThreshold()
            .domain([-.2, -.1, 0, .1, .2])
            .range(["#b1290a", "#e74e29", "#fb937a", "#d1cdff", "#9686f7", "#3d0e87"]);

        this.pKeyScale = d3.scaleLinear()
            .domain([-.3, .3])
            .range([0, 240]);

        this.pKeyAxis = d3.axisBottom(this.pKeyScale)
            .tickSize(13)
            .tickValues(this.threshold.domain())
            .tickFormat(this.pctFormat);

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

        this.yScale.domain([-.14, .14])

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
            }) + 2
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
            })
            .ticks(this.isMobile ? 5 : 10);



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


    projectionKey() {

        let _this = this;

        this.pKeyDiv = d3.select(".projection-key");
            // .style("left", `${(this.width/2) - 120}px`)
            // .style("right", `${(this.width/2) - 120}px`)

        this.pKeyDiv.select("svg").html("");

        this.pKey = this.pKeyDiv.select("svg").append("g")
            .call(_this.pKeyAxis)

        this.pKey.selectAll("rect")
            .data(this.threshold.range().map(color => {
                var d = this.threshold.invertExtent(color);
                if (d[0] == null) d[0] = this.pKeyScale.domain()[0];
                if (d[1] == null) d[1] = this.pKeyScale.domain()[1];
                return d;
            }))
            .enter().insert("rect", ".tick")
            .attr("height", 8)
            .attr("x", d => {
                return this.pKeyScale(d[0]);
            })
            .attr("width", d => {
                let a = this.pKeyScale(d[1]);
                let b = this.pKeyScale(d[0]);
                return Math.abs(a - b);
            })
            .attr("fill", d => {
                return this.threshold(d[0]);
            });


    }



    draw() {

        // set up parent element and SVG
        this.element.innerHTML = "";

        d3.select(this.element).classed(this.currCat, true);

        this.tt = d3.select(this.element).append("div").classed("tooltip", true);

        this.setTooltip = setTooltip.init('.has-tooltip')

        this.svg = d3.select(this.element).append('svg');

        this.bkgd = this.svg.append("rect")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("fill", "#fff")
            .on("click", d=> {
                if (this.highlightOn) {     
                    d3.select("#state-select").property('value', 'default');
                    this.clearHighlight(null, null);        
                    this.currCat = "all";
                    this.updateCat("button");
                }

            })


        //Set svg dimensions
        this.svg.attr('width', this.width + this.margin.left + this.margin.right);
        this.svg.attr('height', this.height + this.margin.top + this.margin.bottom);

        // create the chart group.
        this.plot = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
            .attr("class", "chart-g");

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
            .attr("y", this.yScale(.012))
            .attr("x", this.width)
            .attr("text-anchor", "end")
            .text("Growing ↑");

        this.plot.append("text")
            .attr("class", "range-label")
            .attr("y", this.yScale(-.018))
            .attr("x", this.width)
            .attr("text-anchor", "end")
            .text("Shrinking ↓");

        // this.keyDiv = d3.selectAll(".circle-key")
        //     .style("right", `${this.margin.right + 24}px`)
        //     .style("bottom", `15%`)

        this.dots = this.plot.append("g")
            .attr("class", "dots-g");

        this.tracks = this.plot.append("g")
            .attr("class", "tracks-g");

        let trackData = this.industries.filter(d=> {
            return this.lookup[d].lineArray.length > 0;
        })

        this.jobTracks = this.tracks.selectAll("g.track-group")
            .data(trackData, d=> {
                return d;
            })
            .enter()
            .append("g")
            .classed("track-group", true);

        this.jobTracks.append("path")
            .attr("class", d=> {
                let cat = this.lookup[d].projected >= 0 ? "pos" : "neg";
                return `${cat} track`;
            })
            .style("stroke-width", 2)
            .style("fill", "none")
            .attr("d", d => {
                let arr = this.lookup[d].lineArray;
                let pts = [arr[0], arr[arr.length - 1]];
                return this.line(arr);
            })
            .style("stroke", d => {
                let val = this.lookup[d].projected ? this.lookup[d].projected : null;
                return this.threshold(val);
            });

        this.trackStart = this.jobTracks.append("text")
            .classed("track-start", true)
            .datum(d=> {
                let arr = this.lookup[d].lineArray;
                return arr[0];
            })
            .attr("text-anchor", "end")
            .attr("x", d => {
                return this.xScale(d.wage) - 2;
            })
            .attr("y", d => {
                return this.yScale(d.annualized);
            })
            .text(d=> {
                return d.m.substring(0,4);
            });

        this.trackEnd = this.jobTracks.append("text")
            .classed("track-end", true)
            .datum(d=> {
                let arr = this.lookup[d].lineArray;
                return arr[arr.length-1];
            })
            .attr("x", d => {
                return this.xScale(d.wage) + 2;
            })
            .attr("y", d => {
                return this.yScale(d.annualized);
            })
            .text(d=> {
                return d.m.substring(0,4);
            });

        this.projectionKey();
        this.updateDots();
        this.updateDots();
        this.onReady();

       


    }



    updateDots(slider) {

        let _this = this;

        let dur = slider ? 50 : 200;

        if (this.isMobile) {
            dur = 0;
        }

        this.t = d3.transition()
            .ease(d3.easeLinear)
            .duration(dur);

        this.dots.moveToFront();

        this.jobs = this.dots.selectAll(`.dot`)
            .data(this.series[this.index], d => {
                d.sector = this.lookup[d.id].sector;
                d.cat = this.lookup[d.id].projected >= 0 ? "pos" : "neg";
                return d.id;
            });

        this.jobs.enter()
            .append("circle")
            .attr("class", d => {
                return `${d.cat} dot`;
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
                return this.threshold(val);
            });

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
                return this.circleScale(d.emp / Math.PI) * this.scaleFactor;
            });

        this.jobs
            .on("mouseover", function(d) {
                let xPos = d.xPos + _this.margin.left;
                let yPos = d.yPos + _this.margin.top;

                d.lookup = _this.lookup[d.id];

                if (!_this.ttLive) {
                    _this.setTooltip.position(
                        d, [d.xPos + _this.margin.left, d.yPos + _this.margin.top], [_this.width, _this.height]
                    );
                }

                //_this.tt.classed("persistent", this.isMobile);

                d3.select(this).raise();


            })
            .on("mouseout", function(d) {

                if (!_this.ttLive) {
                    _this.setTooltip.deposition();
                    d3.select(this).lower();
                }

            })

        this.jobs.on("click", function(d) {
            let sel = d3.select(this);

            // console.log(sel.datum());

            let ttParams = {
                sel: sel,
                id: d.id,
                type: "id",
                persist: _this.isMobile
            }

            _this.setHighlight(ttParams);

            _this.currCat = "all";
            _this.updateCat();


            trackEvent('circle-click','single');

            d3.select("#industry-select").property('value', sel.datum().sector);

        });



        this.tt.on("click", d => {
            // this.clearHighlight();
            this.ttLive = false;
            this.setTooltip.deposition();

            trackEvent('tooltip-close','mobile');
        });


    }


    setHighlight(params) {
    
        this.highlightOn = true;

        this.tt.classed("persistent", params.persist);

        this.jobs.classed("inactive", true).classed("active", false);
        
        params.sel.classed("inactive", false).classed("active", d=> {
            return true;
        });

        this.jobTracks.classed("active", false);

        let activeTrack = this.jobTracks.filter(t => {

                if (params.type === "id") {
                    return t === params.id;
                }

            })
            .classed("active", true);

        d3.select("button.clear").classed("active", true);
        d3.select("#industry-select").property('value', params.id);

        if (params.persist) {

            let datum = params.sel.datum();
            datum.lookup = this.lookup[params.id];
            this.setTooltip.position(
                datum, [datum.xPos + this.margin.left, datum.yPos + this.margin.top], [this.width, this.height]
            );

            this.ttLive = true;

        } else {
            this.ttLive = false;
        }

        this.currCat = "all";
        //this.updateCat();

    }


    clearHighlight() {

        console.log("clearHighlight");

        this.highlightOn = false;

        this.ttLive = false;
        this.setTooltip.deposition();
        this.jobs.classed("inactive", false).classed("active", false);
        this.jobTracks.classed("active", false);
        d3.select("button.clear").classed("active", false);
        d3.select("#industry-select").property('value', 'default');

        //this.currCat = "all";
        this.updateCat();

    }




    updateCat(origin) {

        console.log("updateCat");

        let cats = ["all", "pos", "neg"];

        cats.forEach(cat=> {
            d3.select(this.element).classed(cat, false);
        });

        d3.select(this.element).classed(this.currCat, true);

        let sel = this.jobs.filter(d=> {
            return d.cat === this.currCat;
        });

        sel.raise();

        d3.selectAll(".cat-nav button").classed("active", false);
        d3.select(`button[val='${this.currCat}']`).classed("active", true);

        if (this.currCat !== "all") {
            this.highlightOn = true;
        }

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