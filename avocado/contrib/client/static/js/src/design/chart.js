require.def('design/chart', ['design/form', 'lib/highcharts'], function(form) {
    
        var UNSELECTED_COLOR = "#4572A7";
        var SELECTED_COLOR   = "#FF7373";
        var MINIMUM_SLICE = 0.07;
        
        var getPieChart = function(view, concept_id, $location){
            // HighCharts cannot handle boolean values in the coordinates
            $.each(view.data.coords, function(index,element){
               view.data.coords[index][0] = String(view.data.coords[index][0]);
               if (view.data.coords[index][0] === "null") {
                      view.data.coords[index][0] = "No Data";
               }
            });
            
            // We only use pie charts for series with <= 3 choices.
            // Verify that no one piece is less than MINIMUM_SLICE of
            // the whole thing / NOTE this doesn't work great yet
            var coords = view.data.coords;
            var data_store = {};
            $.each(coords, function(index,element){
                data_store[element[0]] = element[1];
            });
            
            var sum = 0;
            $.each(coords, function(index, element){
               sum = sum + element[1];
            });
            var min_slice_width = sum * MINIMUM_SLICE;
            $.each(coords, function(index,element){
               if (element[1] < min_slice_width){
                   element[1] = min_slice_width;
               }
            });
               
            var $chartDiv = $('<div class="chart"></div>');
            $chartDiv.css("display","none");
            $location && $location.append($chartDiv);
            var selected = [];
            
            var notify = function(){
                $chartDiv.trigger("ElementChangedEvent", [{name:concept_id+"_"+view.data.pk, value:selected}]);
            };
            
            $chartDiv.bind("UpdateElementEvent", function(evt, element){
                if (element.name === concept_id+"_"+view.data.pk){
                    selected = element.value;
                }
            });
            
            Highcharts.setOptions({colors: [UNSELECTED_COLOR, UNSELECTED_COLOR, UNSELECTED_COLOR]});
            
            var chart = new Highcharts.Chart({
                chart: {
                    marginBottom:50,
                    renderTo: $chartDiv.get(0),
                    defaultSeriesType: 'pie',
                    zoomType:''
                },
                tooltip:{
                    formatter:function(){
                        return "" + data_store[this.point.name];
                    }
                },
                plotOptions:{
                    series:{
                        events: {
                            click : function(event) {
                                var category = event.point.category || event.point.name;               
                                var index = $.inArray(category,selected);
                                if (index === -1) {
                                    event.point.update({color:SELECTED_COLOR});
                                    selected.push(category);
                                }else{
                                    event.point.update({color:UNSELECTED_COLOR});
                                    selected.splice(index,1);
                                }
                                notify();
                                chart.hoverPoint = event.point;
                                chart.hoverSeries = this;
                            }
                        }
                    },
                    pie:{
                        dataLabels: {
                            enabled: true,
                            formatter: function() {
                                           return this.point.name;
                                       }
                        },
                        borderWidth: 3,
                        allowPointSelect: false,
                        cursor: "pointer",
                        enableMouseTracking: true,
                        stickyTracking: false,
                   
                        states:{
                            hover:{
                                brightness: 0
                            }
                        }
                    }
                },
            
                credits:{
                    enabled: false
                },
                legend:{
                    enabled: false
                },
                title: {
                    text: view.data.title
                },
                series: [{
                   type: 'pie',
                   name: view.data.title,
                   data: view.data.coords
                }]
            });
          
            $chartDiv.bind("GainedFocusEvent", function(evt){
                   // Rotated text does not show up without this in 
                   // ie 8 and ie 7
                   $.map(chart.series[0].data, function(element,index){
                          var category = element.name || element.category;
                          if ($.inArray(category, selected) !==-1){
                              element.update({color:SELECTED_COLOR});
                          }else{
                              element.update({color:UNSELECTED_COLOR});
                          }
                          $(element.tracker.element).mouseover();
                          $(element.tracker.element).mouseout();
                    });

                   chart.xAxis[0].isDirty = true;
                   chart.yAxis[0].isDirty = true;
                   chart.isDirty = true;
                   chart.series[0].isDirty = true;
                   chart.redraw();
             });
            
             $chartDiv.bind("UpdateDSEvent", function(evt, ds){
                selected =  ds[concept_id+"_"+view.data.pk];
             });
            
            return $chartDiv;
        };
    
        var getBarChart = function(view, concept_id, $location) {
            var $chartDiv = $('<div class="chart"></div>');
            $chartDiv.css("display","none");
            $location && $location.append($chartDiv);
            var selected = [];
            var notify = function(){
                $chartDiv.trigger("ElementChangedEvent", [{name:concept_id+"_"+view.data.pk, value:selected}]);
            };
            
            $chartDiv.bind("UpdateElementEvent", function(evt, element){
                if (element.name === concept_id+"_"+view.data.pk){
                    selected = element.value;
                }
            });
            $.each(view.data.coords, function(index,element){
                   view.data.coords[index][0] = String(view.data.coords[index][0]);
                   if (view.data.coords[index][0] === "null") {
                       view.data.coords[index][0] = "No Data";
                   }
            });
            var chart = new Highcharts.Chart({
               chart: {
                  marginLeft:100,
                  marginBottom:50,
                  renderTo: $chartDiv.get(0),
                  defaultSeriesType: 'column',
                  zoomType:'',
                  events:{
                      // Both the load and redraw functions handle making sure the datalabels are 
                      // clickable for the bars and that they are the proper color
                      redraw: function(event){
                           for (var index = 0; index < this.series[0].data.length; index++){
                                var col = this.series[0].data[index];
                                                              
                                $(col.dataLabel.element).attr("fill", col.color);//chrome/firefox
                                $(col.dataLabel.element).css("color", col.color);//ie
                                $(col.dataLabel.element).hover(function(event){
                                    $(this).css("cursor","pointer");
                                }, function(event){
                                    $(this).css("cursor","");
                                });
                            
                                $(col.dataLabel.element).click(function(c){
                                    return (function(event){
                                             c.series.chart.hoverPoint=c;
                                             c.series.chart.isDirty = true;
                                             var index = $.inArray(c.category, selected);
                                             if (index === -1) {
                                                 c.update({color:SELECTED_COLOR});
                                                 selected.push(c.category);
                                             }else{
                                                 c.update({color:UNSELECTED_COLOR});
                                                 selected.splice(index,1);
                                             }
                                             notify();
                                        });            
                                }(col));
                           }
                      },
                      load: function(){
                          for (var index = 0; index < this.series[0].data.length; index++){
                                var col = this.series[0].data[index];
                                $(col.dataLabel.element).hover(function(event){
                                    $(this).css("cursor","pointer");
                                }, function(event){
                                    $(this).css("cursor","");
                                });
                            
                                $(col.dataLabel.element).click(function(c){
              
                                    return (function(event){
                                           c.series.chart.hoverPoint = c;
                                           c.series.chart.isDirty = true;
                                           var index = $.inArray(c.category, selected);
                                           if (index === -1) {
                                               $(c.dataLabel.element).css("color", SELECTED_COLOR);
                                               c.update({color:SELECTED_COLOR});
                                               selected.push(c.category);
                                           }else{
                                               $(c.dataLabel.element).css("color", UNSELECTED_COLOR);
                                               c.update({color:UNSELECTED_COLOR});
                                               selected.splice(index,1);
                                           }
                                      });                       
                                }(col));
                           }
                      }
                  }
               },
               plotOptions:{
                   series:{
                       events: {
                           click : function(event) {                
                                var category = event.point.category || event.point.name;               
                                var index = $.inArray(category,selected);
                                if (index === -1) {
                                    event.point.update({color:SELECTED_COLOR});
                                    selected.push(category);
                                }else{
                                    event.point.update({color:UNSELECTED_COLOR});
                                    selected.splice(index,1);
                                }
                                chart.hoverPoint = event.point;
                                chart.hoverSeries = this;
                                notify();
                           }
                       }  
                   },
                   column:{
                       dataLabels: {
                           enabled: true
                       },
                       allowPointSelect:false,
                       cursor:"pointer",
                       enableMouseTracking:true,
                       stickyTracking:false
                   }
               },
               credits:{
                   enabled:false
               },
               legend:{
                   enabled:false
               },
               title: {
                  text: view.data.title
               },
               tooltip:{
                      formatter:function(){
                          return this.point.category + ", " + this.y;
                      }
               },
               xAxis: {
                  categories: $.map(view.data.coords, function(element, index){
                     return element[0]; 
                  }),
                  title: {
                      text: view.data.xaxis
                  },
                  labels:{
                      align:"left",
                      rotation:90,
                      y:10
                  }
               },
               yAxis: {
                  min:0,
                  title: {
                     text: view.data.yaxis
                  },
                  labels:{
                       rotation: 45
                  }
               },
               series: [{
                  name: view.data.title,
                  data: $.map(view.data.coords, function(element, index){
                                                    return element[1]; 
                                                })
                }]
            });

            $chartDiv.bind("GainedFocusEvent", function(evt){
                   $.map(chart.series[0].data, function(element,index){
                       if ($.inArray(element.category, selected) !==-1){
                           element.update({color:SELECTED_COLOR});
                       }else{
                           element.update({color:UNSELECTED_COLOR});
                       }
                       // This is a hack to fix a bug in ie7 where bars that
                       // have been moused over, vanish if the view is taken off
                       // screen and then put back.
                       $(element.tracker.element).mouseover();
                       $(element.tracker.element).mouseout();
                    });
                    // Rotated text does not show up in ie8 and ie7 
                    // when the graph is inserted dynamically without this
                    chart.xAxis[0].isDirty = true;
                    chart.yAxis[0].isDirty = true;
                    chart.isDirty = true;
                    chart.series[0].isDirty = true;                 
                    chart.redraw();
            });
            
            $chartDiv.bind("UpdateDSEvent", function(evt, ds){
               selected =  ds[concept_id+"_"+view.data.pk];
            });
            return $chartDiv;
        };    
    
        var getLineChart = function(view, concept_id, $location) {
            var $range_form = form.Form({fields:[{ datatype: "decimal",
                                                   label: view.data.title,
                                                   pk: view.data.pk}]}, concept_id);
        
            $range_form.find("input").css("margin","10px");
            var $chartDiv = $('<div class="chart"></div>');
            $chartDiv.css("display","none");
            $location && $location.append($chartDiv);
            var chart = new Highcharts.Chart({
               chart: {
                  marginBottom:50,
                  renderTo: $chartDiv.get(0),
                  defaultSeriesType: 'line',
                  zoomType:'x',
                  events:{
                      selection: function(event){
                          var color = $range_form.find("select[name*=operator]").val() === "exclude:range" ? "#FF7373" : '#DCFEC5';
                          var extremes = this.xAxis[0].getExtremes();
       
                          var min = event.xAxis[0].min;
                          var max = event.xAxis[0].max;
             
                          min = min < extremes.min ? extremes.min : min;
                          max = max > extremes.max ? extremes.max : max;
                          min = parseFloat(min).toFixed(1);// TODO how are we going to handle this if they are fractions
                          max = parseFloat(max).toFixed(1);// TODO properly calculate extremes 
                          
                          $("input[name*=input0]", $range_form).val(min).change();
                          $("input[name*=input1]", $range_form).val(max).change();
                          this.xAxis[0].removePlotBand();
                          this.xAxis[0].addPlotBand({
                            from:  min,
                            to:   max,
                            color: color
                          });
                          
                          this.xAxis[0].isDirty = true;
                          chart.isDirty = true;
                          this.xAxis[0].redraw();
                          chart.redraw();
                          event.preventDefault();
                      }
                  }
               },
               tooltip:{
                      formatter:function() {
                          return "" + this.y;
                      }
               },
               credits:{
                   enabled:false
               },
               legend:{
                   enabled:false
               },
               title: {
                  text: view.data.title
               },
               xAxis: {
                   min:0,
                   title: {
                       text: view.data.xaxis
                   },
                   labels:{
                         align:"left",
                         rotation:90,
                         y:10
                     }
               },
               yAxis: {
                   min:0,
                   title: {
                       style: {
                       color: '#6D869F',
                       fontWeight: 'bold'
                       },
                      text:  view.data.yaxis,
                      rotation : 270
                   },
                   labels:{
                      rotation:45
                   }
               },
               series: [{
                   name: view.data.title,
                   data: view.data.coords
               }]
            });
        
            var extremes = chart.xAxis[0].getExtremes();     
        
            // Create handler for updating graph whnen user changes min and max values
            // in the form   
            var manual_field_handler = function(event){
                var color = $range_form.find("select[name*=operator]").val() === "exclude:range" ? "#FF7373" : '#DCFEC5';
                var min = parseFloat($("input[name*=input0]", $range_form).val()).toFixed(1);
                var max = parseFloat($("input[name*=input1]", $range_form).val()).toFixed(1);
                if (min && max){
                    chart.xAxis[0].removePlotBand();
                    chart.xAxis[0].addPlotBand({
                      from: min,
                      to: max,
                      color:color
                    });
                }
                chart.xAxis[0].isDirty=true;
                chart.redraw();
                return false;
            };
        
            // Event handlers for the input form 
            $("select[name*=operator]", $range_form).change(manual_field_handler);
            $("input", $range_form).focusout(manual_field_handler);
            $("input", $range_form).keydown(function(evt){
                // TODO Validate Input here!
                if (evt.which === 13) {      // User hit Enter key
                    manual_field_handler(evt);
                }
            });
            
            $range_form.submit(manual_field_handler);
            $range_form.css("margin-left", chart.plotLeft);
            $chartDiv.prepend($range_form);
        
            // By default select the middle 1/3 of the chart
            var xrange = extremes.max - extremes.min;
            var third = (1/3) * xrange;

            $("input[name*=input0]", $range_form).val((extremes.min+third).toFixed(1));
            $("input[name*=input1]", $range_form).val((extremes.min+2*third).toFixed(1));
            
            manual_field_handler(null);
         
            // Listen for updates to the datasource from the framework
            $chartDiv.bind("UpdateDSEvent", function(evt, ds){
                $range_form.triggerHandler(evt,[ds]);
                
            });
            
            $chartDiv.bind("UpdateElementEvent", function(evt, element) {
                // Use triggerHandler here because otherwise it will bubble back up
                // the surround container (this object) and start an endless loop.
                $range_form.triggerHandler(evt,[element]);
                manual_field_handler(null);
            });

            $chartDiv.bind("GainedFocusEvent", function(evt){
                   $('input,select',$chartDiv).change();
                   
                   chart.xAxis[0].isDirty = true;
                   chart.yAxis[0].isDirty = true;          
                   chart.isDirty = true;
                   chart.redraw();
             });
            
            return $chartDiv;
        };
        return {
            getBarChart: getBarChart,
            getLineChart: getLineChart,
            getPieChart: getPieChart
        };
});
