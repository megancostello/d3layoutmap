
const margin = {top:20, left:50, right:20, bottom:20};

const width = 650 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;



let visType = 'force';


Promise.all([ // load multiple files
	d3.json('airports.json'),
	d3.json('world-110m.json')
]).then(data=>{ // or use destructuring :([airports, worldmap])=>{ ... 
	let airports = data[0]; // data1.csv
	let worldmap = data[1]; // data2.json
    console.log('airports ', airports);
    console.log('worldmap ', worldmap);
    // initialization
    const svg = d3.select(".nodeMap")
    .append("svg")
    //.attr("viewBox", [0,0,width,height]);
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);
        
    //  const gr = svg.append("g")
    //      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    circleScale = d3.scaleLinear()
        .domain(d3.extent(airports.nodes, d=>d.passengers))
        .range([5,15]);

    const geo = topojson.feature(worldmap, worldmap.objects.countries);
    const features = geo.features;

    const projection = d3.geoMercator()
        .fitExtent([[0,0], [width,height]], geo); // put the converted geojson in the second argument;

    const path = d3.geoPath().projection(projection);

    svg
        .selectAll("path")
        .data(features) // geojson feature collection
        .join("path")
        .attr("class", "worldMap")
        .attr("fill", "steelblue")
        .attr("d", path)
        .style("opacity", 0)
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .append("title")
        .text(d => d.properties.name);

    svg.append("path")
        .datum(topojson.mesh(worldmap, worldmap.objects.countries))
        .attr("d", path)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr("class", "subunit-boundary");

    const force = d3.forceSimulation(airports.nodes)
        .force("charge", d3.forceManyBody().strength(5))
        .force("center", d3.forceCenter(width/2, height/2))
        .force("x", d3.forceX(width/2))
        .force("y", d3.forceY(height/2))
        .force('link', d3.forceLink(airports.links))
        .force("collide", d3.forceCollide().radius(function(d) {return circleScale(d.passengers)+10}))
        .on("tick", ticked);

    

    const links = svg.append("g")
        .attr("class", "allLinks")
        .selectAll("line")
        .data(airports.links)
        .join("line")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.6);

    //force.nodes(nodes);
    //force.force("link").links(links);

    const drag = d3.drag()
        .on("start", event => {
            if (!event.active) force.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;

        })
        .on("drag", event => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        })
        .on("end", event => {
            if (!event.active) force.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        })

    drag.filter(event => visType === "force");

    const nodes = svg.append("g")
        .attr("class", "allNodes")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(airports.nodes)
        .join("circle")
        .attr("fill", "lavender")
        .attr("r", d => circleScale(d.passengers))
        .call(drag);

    nodes.append("title")
        .text(d=>d.name);

    function ticked() {
        links
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        nodes
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        }

    //geo map
    d3.selectAll("input[name=type]").on("change", event=>{
            visType = event.target.value;// selected button
            switchLayout();
        });
    

    function switchLayout() {
        if (visType === "map") {
                console.log("start world map");
                // stop the simulation
                force.stop();
                // set the positions of links and nodes based on geo-coordinates
                links
                    .transition()
                    .duration(1000)
                    .attr("x1", d => projection([d.source.longitude, d.source.latitude])[0])
                    .attr("y1", d => projection([d.source.longitude, d.source.latitude])[1])
                    .attr("x2", d => projection([d.target.longitude, d.target.latitude])[0])
                    .attr("y2", d => projection([d.target.longitude, d.target.latitude])[1]);
                nodes
                    .transition()
                    .duration(1000)
                    .attr("cx", d => projection([d.longitude, d.latitude])[0])
                    .attr("cy", d => projection([d.longitude, d.latitude])[1]);

                
                // set the map opacity to 1
                svg.selectAll(".worldMap").style("opacity", 1);
            } else { // force layout
                console.log("start force map");
                // restart the simulation
                links
                    .transition()
                    .duration(2000)
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
                nodes
                    .transition()
                    .duration(2000)
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);

                force.restart();
                // set the map opacity to 0
                svg.selectAll(".worldMap").style("opacity", 0);
            }
        }
})


