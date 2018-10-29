// --------------------------------------------------------------------------
// Initializes names function tied to Flask app - populates selector
// --------------------------------------------------------------------------
d3.json("/names", function(error, response) {
    // error trapping for failed call from Flask
    if (error) return console.warn(error);

    var $dropDown = document.getElementById("selDataset");

    for (var i=0; i< response.length; i++){
        var $optionChoice = document.createElement("option");
        $optionChoice.innerHTML = response[i];
        $optionChoice.setAttribute("value", response[i]);
        $dropDown.appendChild($optionChoice);
    };
});

//Initializes the web page render
function init(sample){

    getMetadata(sample);

    //Gets data ready for the pie chart
    d3.json("/samples/" + sample, function(error, sampleResponse){
        // error trapping for failed call from Flask
        if (error) return console.warn(error);

        // parses repsonse data and take slice of first ten
        // data pairs returned from Flask
        resLabels = sampleResponse["otu_ids"].slice(0,10);
        resValues = sampleResponse["sample_values"].slice(0,10);

        for (var i=0; i<10; i++){
            if (resLabels[i] == 0){
                resLabels = resLabels.slice(0,i)
            };
            if (resValues[i] == 0){
                resValues[i] = resValues.slice(0,i)
            };
        };

        // ------------------------------------------------------------------
        // get description matches of top ten bacteria and creates list
        // ------------------------------------------------------------------
        d3.json("/otu", function(error, response){
        // error trapping for failed call from Flask
        if (error) return console.warn(error);

        var bacteriaNamesPie = [];
        for (var i=0; i< resLabels.length; i++){
            bacteriaNamesPie.push(response[resLabels[i]])
        };

        //  list of names for Bubble Chart
        var bacteriaNamesBub = [];
        for (var i =0; i<sampleResponse["otu_ids"].length; i++){
            bacteriaNamesBub.push(response[sampleResponse["otu_ids"][i]])
        };

        // sets up data for pie chart
        var data = [{
                     values: resValues,
                     labels: resLabels,
                     hovertext: bacteriaNamesPie,
                     hoverinfo: {bordercolor: 'black'},
                     type: 'pie'
        }];

        // sets up layout for pie chart
        var layout = {
                      height: 500,
                      title: "Top 10 Sample Counts for " + sample
                     };

        // plots piechart
        Plotly.newPlot('piePlot', data, layout);

        //Sets up the Bubble Chart
        var trace = {
            x: sampleResponse["otu_ids"],
            y: sampleResponse["sample_values"],
            mode: 'markers',
            marker: {
                colorscale: 'Earth',
                color: sampleResponse["otu_ids"],
                size: sampleResponse["sample_values"]
            },
            text: bacteriaNamesBub,
            type: "scatter"
        };

        var bubbleData = [trace];

        var bubbleLayout = {
            title: 'Sample Ten Values for ' + sample,
            xaxis: {title: "OTU ID"},
            hovermode: 'closest',
            showlegend: false,
            height: 600,
            margin:
                {
                    top: 10,
                    bottom: 10,
                    right: 10,
                    left: 10
                }
        };

        // plots bubble chart
        Plotly.newPlot('bubblePlot', bubbleData, bubbleLayout);
      });
    });

    console.log("Initial Render Successful!");
};

// Function to update Pie Chart
function updatePie(newValues, newLabels, newNames, sample_name){
    Plotly.restyle("piePlot", "values", [newValues]);
    Plotly.restyle("piePlot", "labels", [newLabels]);
    Plotly.restyle("piePlot", "hovertext", [newNames]);
    Plotly.relayout("piePlot", "title", "Top Sample Counts for " + sample_name);
    console.log("Pie Chart Updated!");
};
// Function to update Bubble Chart
function updateBub(values, labels, names, sample_name){
    Plotly.restyle("bubblePlot", "x", [labels]);
    Plotly.restyle("bubblePlot", "y", [values]);
    Plotly.restyle("bubblePlot", "marker.size", [values]);
    Plotly.restyle("bubblePlot", "text", [names]);
    Plotly.relayout("bubblePlot", "title", "Sample Values for " + sample_name);
    console.log("Bubble Chart Updated!");
};

// handle change in dropdown
function optionChanged(chosenSample){
  getMetadata(chosenSample);

    // handle new get request for choice
    d3.json("/samples/" + chosenSample, function(error, newResponse){
      // error trapping for failed call from Flask
      if (error) return console.warn(error);

      var newResLabels = newResponse["otu_ids"].slice(0,10);
      var newResValues = newResponse["sample_values"].slice(0,10);

      for (var i=0; i<10; i++){
        if (newResLabels[i] == 0){
            newResLabels = resLabels.slice(0,i)
        };
        if (newResValues[i] == 0){
            newResValues[i] = resValues.slice(0,i)
        };
      };

      d3.json("/otu", function(error, otuResponse){
        // error trapping for failed call from Flask
        if (error) return console.warn(error);

        var newBacteriaNames = [];

        for (var i=0; i< newResLabels.length; i++){
            newBacteriaNames.push(otuResponse[newResLabels[i]])
        };
        //  all bacteria names for bubble hover
        var allBacteriaNames = [];
        for (var i=0; i<newResponse["otu_ids"].length; i++){
            allBacteriaNames.push(otuResponse[newResponse["otu_ids"][i]])
        };

        // new vars for updateBub function
        var newValuesBub = newResponse['sample_values'];
        var newLabelsBub = newResponse['otu_ids'];

        // update plots
        updatePie(newResValues, newResLabels, newBacteriaNames, chosenSample);
        updateBub(newValuesBub, newLabelsBub, allBacteriaNames, chosenSample);
      })

  });
};

function getMetadata(selectedID){
  d3.json("/metadata/" + selectedID, function(error, response){
    // error trapping for failed call from Flask
    if (error) return console.warn(error);
    // console.log(metadata);

    // get list of keys from response
    var resKeys = Object.keys(response);

    // Accesses the division in HTML
    var $sampleMetadata = document.querySelector("#sample-metadata");

    // clears panel
    $sampleMetadata.innerHTML = null;

    // iterates through keys and creates p element for each key
    for (var i=0; i<resKeys.length; i++){
        var $newDataLine = document.createElement('p');
        $newDataLine.innerHTML = resKeys[i] + ": " + response[resKeys[i]];
        $sampleMetadata.appendChild($newDataLine)
    };
  });
};

// initial render using first sample in dataset

init("940");
//window.location.reloaad();
//Browser.quit();