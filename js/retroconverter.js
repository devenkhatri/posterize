var pixelator = {
  image_id:     "image",
  image_url:    null,
  canvas:       null,
  ctx:          null,
  num_settings: 0,
  atariRez: 16,
  nesRez:8,
  snesRez: 4,
  rezSliderMin: 2,
  root_url:     "",
  no_canvas_dialog:     $("<div class=\"dialog\" />"),

	check_no_canvas: function() {
    if (!Modernizr.canvas) {
		  $(pixelator.no_canvas_dialog).html("<p>Sorry! Your browser doesn't support the HTML5 Canvas tag. This website will not work for you.</p>"
			  + "<p>Try again in a more modern browser.</p>").dialog({
			  title: "It's a sad day...",
        modal:    true,
        minWidth: 400,
        buttons: {
          "Close": function() {
            $(this).dialog("close");
          }
				}
      });
	  }
	},
	
  // no error checking yet
  load_url: function(image) {
    pixelator.load_image($("#image_url").val());
  },

  /**
   * Called anytime anything changes.
   */
  repixelate: function() {
    if (pixelator.canvas == null) {
      pixelator.canvas = $("#image")[0];
      pixelator.ctx    = pixelator.canvas.getContext('2d');
      pixelator.canvas_width     = parseInt($(pixelator.canvas).attr("width"));
      pixelator.canvas_height    = parseInt($(pixelator.canvas).attr("height"))
    }

    ClosePixelate.renderClosePixels(pixelator.ctx, pixelator.get_settings(), pixelator.canvas_width, pixelator.canvas_height);
  },

  get_settings: function() {
    var settings = [];
    $("#settings .setting_group").each(function() {
      settings.push({
        shape:      $(this).find(".shape").val(),
        resolution: parseInt($(this).find(".resolution").val()),
        offset:     parseInt($(this).find(".offset").val()),
        size:       parseInt($(this).find(".size").val()),
        alpha:      parseFloat($(this).find(".alpha").val())
      });
    });
  
    return settings;
  },
    
  add_setting: function(default_settings) {
    var data = $.extend({
      shape:            "circle",
      circle_selected:  "",
      square_selected:  "",
      diamond_selected: "",
      resolution:       32,
      offset:           0,
      size:             30,
      alpha:            0.5,
      repixelate:       false,
	  rezmin:           pixelator.rezSliderMin,
      row:              ++pixelator.num_settings
    }, default_settings);



    var new_setting_html = $("#setting_group_template").html();
    $.each(data, function(key, value) {
      var curr_key = new RegExp("%%" + key.toUpperCase() + "%%", "g");
      new_setting_html = new_setting_html.replace(curr_key, value);
    });

    $("#setting_groups").append(new_setting_html);;

    if (data.repixelate) {
      pixelator.repixelate();
    }

    // if there's no native support for the range element, offer the jQuery slider
    if (!Modernizr.inputtypes.range){
      $("input[type=range]").each(function() {
        if ($(this).nextAll(".slider").length) {
          return;
        }
        var range      = $(this);
        //var slider_div = $("<div class=\"slider\" />");
		var slider_div = $("<div class=\"slider\" id=\""+this.id+"jquery\" />");
        slider_div.width(range.width());
        range.after(slider_div.slider({
          min:   parseFloat(range.attr("min")),
          max:   parseFloat(range.attr("max")),
          value: parseFloat(range.val()),
          step:  parseFloat(range.attr("step")),
          slide: function(evt, ui) { range.val(ui.value); pixelator.repixelate(); },
          change: function(evt, ui) { range.val(ui.value); pixelator.repixelate(); }
        }));
      }).hide();
    }

    return false;
  },
  
  load_preset: function(num, repixelate) {
    var num = parseInt(num);
        
    $("#setting_groups").html("");
    pixelator.num_settings = 0;
 
    var settings = [];
    switch (num) {
	  case 1:
        settings = [
          { shape: 'square', resolution: pixelator.atariRez, size: 64, offset: 0, alpha: 1 }
        ];
        break;	
      case 2:
        settings = [
          { shape: 'square', resolution: pixelator.nesRez, size: 32, offset: 0, alpha: 1 }
        ];
        break;
      case 3:
        settings = [
          { shape: 'square', resolution: pixelator.snesRez, size: 24, offset: 0, alpha: 1 }
        ];
        break;
    }


    // display the preset settings
    for (var i=0, j=settings.length; i<j; i++) {
      var curr_setting_id = pixelator.num_settings;
      pixelator.add_setting(settings[i]);
    }

    // update the selected preset style
    $("#preset_styles li").removeClass("selected");
    $("#preset_styles li:nth-child(" + num + ")").addClass("selected");

    // render the image
    if (repixelate === true) {
      ClosePixelate.renderClosePixels(pixelator.ctx, settings, pixelator.canvas_width, pixelator.canvas_height);
    }
  },

  /**
   * Called on page load and when example image is selected. It recreates the canvas with the current
   * preset/custom settings. This flows into pixelator.image_loaded, which fires when the image has actually been
   * loaded in the page and is ready to edit.
   */
  load_image: function(custom_image_url) {
    var image = "example_images/" + $("#preset_images").val();
    if (custom_image_url !== undefined) {
      image = custom_image_url;
    }
    $("#image_container").html("<img id=\"image\" />");
      
    $("#image").bind("load", function() { 
      $Q.queue.push([
        function() {
          ClosePixelate.imgData = null;
          pixelator.canvas      = null;
		  
		  //NEW STUFF HERE
		  //BRANCH BASED ON SIZE
		  //ALTER SLIDER VALUES AND Preset Settings
		  pixelsRoot = Math.sqrt(document.getElementById(pixelator.image_id).width * document.getElementById(pixelator.image_id).height);
		  seedRez = Math.round( (pixelsRoot/200) / 2) * 2  ;
		  
		  if (seedRez == 0) {
			seedRez = 2;  
		  }
		 
		  pixelator.snesRez = seedRez;
		  pixelator.nesRez = pixelator.snesRez * 2;
          pixelator.atariRez = pixelator.nesRez * 2;
		 
		  
		  //min parameter is readonly for range input so can't modify it right now
		  //alert(document.getElementById("rezSlider").value);
		  //branch this because this only handles if its jquery not range input
		  $("#rezSliderjquery").slider("option","min",pixelator.snesRez);
		  pixelator.rezSliderMin = pixelator.snesRez;
		  
		  pixelator.load_preset(2);
		  
		 
          document.getElementById(pixelator.image_id).closePixelate(pixelator.get_settings());
        },
        function () {
		  var ready = false;
		  if ($("canvas#image").length) {
            pixelator.canvas = $("#image")[0];
            pixelator.ctx    = pixelator.canvas.getContext("2d");
            pixelator.canvas_width     = parseInt($(pixelator.canvas).attr("width"));
            pixelator.canvas_height    = parseInt($(pixelator.canvas).attr("height"));
			ready = true;
		  }
	      return ready;
        }
      ]);

      $Q.run();

    });
    
    $("#image_container img").attr("src", image);
  },

  _get_param_by_name: function(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null) {
      return "";
    } else {
      return decodeURIComponent(results[1].replace(/\+/g, " "));
    }
  },
  

};
//end pixelator


// 
var $Q = {
    // each index should be an array with two indexes, both functions:
    // 0: the code to execute
    // 1: boolean test to determine completion
    queue: [],
    run: function()
    {
        if (!$Q.queue.length)
            return;

        // if this code hasn't begun being executed, start 'er up
        if (!$Q.queue[0][2])
        {
            $Q.queue[0][0]();
            $Q.queue[0][2] = window.setInterval("$Q.process()", 50);
        }
    },
    process: function()
    {
        if ($Q.queue[0][1]())
        {
            window.clearInterval($Q.queue[0][2]);
            $Q.queue.shift();
            $Q.run();
        }
    }
}
