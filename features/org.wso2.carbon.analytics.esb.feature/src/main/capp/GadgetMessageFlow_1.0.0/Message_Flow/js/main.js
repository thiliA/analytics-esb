    var TYPE = 1;
    var TOPIC = "subscriber";
    // var page = gadgetUtil.getCurrentPage();
    var qs = gadgetUtil.getQueryString();
    var timeFrom, timeTo, timeUnit = null;

    $(function() {
        // if (qs[PARAM_ID] == null) {
        //     $("#canvas").html(gadgetUtil.getDefaultText());
        //     return;
        // }
        timeFrom = gadgetUtil.timeFrom();
        timeTo = gadgetUtil.timeTo();
        // console.log("MESSAGE_FLOW[" + page.name + "]: TimeFrom: " + timeFrom + " TimeTo: " + timeTo);

        gadgetUtil.fetchData(CONTEXT, {
            type: 10,
            id: qs.id,
            timeFrom: timeFrom,
            timeTo: timeTo
        }, onData, onError);

    });

    gadgets.HubSettings.onConnect = function() {
        gadgets.Hub.subscribe(TOPIC, function(topic, data, subscriberData) {
            onTimeRangeChanged(data);
        });
    };

    function onTimeRangeChanged(data) {
        timeFrom = data.timeFrom;
        timeTo = data.timeTo;
        timeUnit = data.timeUnit;
        gadgetUtil.fetchData(CONTEXT, {
            type: TYPE,
            timeFrom: timeFrom,
            timeTo: timeTo
        }, onData, onError);
    };

    function onData(response) {
        var data = response.message;
        if (data.length == 0) {
            $("#canvas").html(gadgetUtil.getEmptyRecordsText());
            return;
        }
        $("#canvas").empty();
        var g = new dagreD3.graphlib.Graph({compound:true})
          .setGraph({})
          .setDefaultEdgeLabel(function() { return {}; });

         var nodes = data;
         // g.setNode("group1", {label: 'Mediator', clusterLabelPos: 'top', style: 'fill: #ffd47f'});

         nodes.forEach(function(node,i) {
            g.setNode(node.id,{label : node.label});
            if(node.children) {
                node.children.forEach(function(child) {
                   g.setEdge(node.id, child,{lineInterpolate: 'basis', arrowheadClass: 'arrowhead'});
               });
            }
            if(node.group) {
                g.setParent(node.id,node.group);
            }
            if(node.type && node.type==="group") {
                g.setNode(node.id, {label: node.label, clusterLabelPos: 'top'});
            }
         });

        // Round the corners of the nodes
         g.nodes().forEach(function(v) {
             var node = g.node(v);
             node.rx = node.ry = 7;
         });
        // Create the renderer
        var render = new dagreD3.render();
        // Set up an SVG group so that we can translate the final graph.
        var svg = d3.select("svg"),
            svgGroup = svg.append("g");
        // Run the renderer. This is what draws the final graph.
        render(d3.select("svg g"), g);
        // Center the graph
        var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
        svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
        svg.attr("height", g.graph().height + 140);
    };

    function onError(msg) {
        $("#canvas").html(gadgetUtil.getErrorText(msg));
    };