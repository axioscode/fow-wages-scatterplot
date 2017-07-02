let d3 = require("d3");

class lineChart {

    constructor(opts) {
        this.element = opts.element;
        this.aspectHeight = opts.aspectHeight ? opts.aspectHeight : .68;
        this.onReady = opts.onReady ? opts.onReady : null;
        this.data = opts.data ? opts.data : null;
        this.filter = opts.filter ? opts.filter : null;

        this.parseTime = d3.timeParse("%Y%m");
        this.formatTime = d3.timeFormat("%Y");
        this.pctFormat = d3.format(".0%");

        this._setData();
        this.update();

    }


    _setData() {
        this.series = [];
        let keys = Object.keys(this.data);
        keys.forEach(k => {
            this.series.push(this.data[k]);
        });


        this.series.forEach(s => {
            s.series.forEach(d => {
                d.autoProb = d.autoProb ? +d.autoProb : null,
                d.date = this.parseTime(d.mo);
                d.annualized = d.emp && d.yrAgo ? ((d.emp - d.yrAgo) / d.yrAgo) : null;
            });

            s.series = s.series.filter(d => {
                return d.annualized;
            });

        });


        this.groups = {
            autoHigh: [],
            autoMedium: [],
            autoLow: [],
            projectedPos: [],
            projectedNeg: []
        }


        this.groups.autoHigh = this.series.filter(d => {
            return d.autoProb && d.autoProb >= .5;
        });

        this.groups.autoLow = this.series.filter(d => {
            return d.autoProb && d.autoProb < .5;
        });

        this.groups.projectedPos = this.series.filter(d => {
            return d.projected >= 0;
        });

        this.groups.projectedNeg = this.series.filter(d => {
            return d.projected <= 0;
        });

        this.recessions = [
            //["200104", "200111"],
            ["200801", "200906"]
        ];



    }

    _setDimensions() {
        // define width, height and margin

        this.margin = {
            top: 0,
            right: 15,
            bottom: 30,
            left: 45
        };

        this.width = this.element.offsetWidth - this.margin.left - this.margin.right;
        this.height = (this.element.offsetWidth * this.aspectHeight) - this.margin.top - this.margin.bottom; //Determine desired height here

    }

    _setScales() {

        this.xScale = d3.scaleTime()
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .range([this.height, 0]);

        this.line = d3.line()
            .curve(d3.curveBasis)
            .x(d => {
                return this.xScale(d.date);
            })
            .y(d => {
                return this.yScale(d.annualized);
            })


        this.yScale.domain([
            d3.min(this.series, function(c) {
                return d3.min(c.series, function(d) {
                    return d.annualized;
                });
            }),
            d3.max(this.series, function(c) {
                return d3.max(c.series, function(d) {
                    return d.annualized;
                });
            })
        ]);

        this.xScale.domain([this.parseTime("200206"), this.parseTime("201712")])

        this.yAxis = d3.axisLeft(this.yScale)
            .tickFormat(d => {
                return d > 0 ? `+${this.pctFormat(d)}` : this.pctFormat(d);
            })
            .tickSize(-this.width);

        this.xAxis = d3.axisBottom(this.xScale)
            .tickSize(-this.height)
            .tickFormat(d => {
                let str = `'${this.formatTime(d).substring(2,4)}`;
                return str;    
            })

    }



    update() {
        this._setDimensions();
        this._setScales();
        this.draw();
    }

    draw() {

        // set up parent element and SVG
        this.element.innerHTML = "";

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
            .selectAll("text", "#a5a5a5");

        this.plot.append("g")
            .attr("class", "axis y-axis")
            .call(this.yAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -this.margin.left)
            .attr("x", -this.height/2)
            .attr("text-anchor", "middle")
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("1yr change in employment");

        this.zeroLine = this.plot.append("line")
            .attr("class", "zero-line")
            .attr("x1", 0)
            .attr("x2", this.width)
            .attr("y1", this.yScale(0))
            .attr("y2", this.yScale(0));

        this.recession = this.plot.selectAll(".recession")
            .data(this.recessions).enter()
            .append("rect")
            .attr("class", "recession")
            .attr("x", d => {
                return this.xScale(this.parseTime(d[0]));
            })
            .attr("y", 0)
            .attr("width", d => {
                return this.xScale(this.parseTime(d[1])) - this.xScale(this.parseTime(d[0]));
            })
            .attr("height", this.height);

        this.lines = this.plot.append("g");

        this.updateLines();

        console.log(this.filter);

    }


    updateLines(k) {

        let _this = this;

        var job = this.lines.selectAll(`.occupation.${k}`)
            .data(this.groups[this.filter])
            .enter().append("g")
            .attr("class", d => {
                let proj = d.projected < 0 ? "neg" : "pos";
                return `occupation ${proj} ${k}`;
            })
            .on("mouseover", function(d) {

                _this.tt.html(d.industry_name);

                d3.select(this).classed("active", true)
                    .moveToFront();

                _this.tt.classed("active", true);
            })
            .on("mouseout", function(d) {
                d3.select(this).classed("active", false)
                    .moveToBack();

                _this.tt.classed("active", false);
            })

        job.append("path")
            .attr("class", "line")
            .attr("d", d => {
                return this.line(d.series);
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




export default lineChart;