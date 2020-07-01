/* GLOBAL VARIABLES */
var links, linkCards;

const titleKey = 'title';
const descriptionKey = 'description';
const urlKey = 'url';
const typesKey = 'types';
const tagsKey = 'tags';
const workstreamsKey = 'workstreams';

/* USE TABLETOP.JS TO GRAB OUR LINK DATA FROM A GOOGLE SHEET */
var publicSpreadsheetUrl = 'https://cors-anywhere.herokuapp.com/' + 'https://docs.google.com/spreadsheets/d/1_wTA4jZaujZvV6RfwGmgiffwHOUe1Pv3Gb7ae0lXx1M/pub?output=csv';
function fetchSpreadsheet() {
    return new Promise(function(resolve, reject) {
      Papa.parse(publicSpreadsheetUrl, {
        download: true,
        header: true,
        complete: function(results) {
          resolve(results.data);
        }
      });
    });
}
Promise.all([fetchSpreadsheet()]).then(function(values) {
    getData(values)
});

/* GET OUR FETCHED DATA READY TO USE */
function getData(dataArray){
  /* SAVE OUR FETCHED DATA TO OUR GLOBAL VARIABLES */
  links = dataArray[0];
  /* LOOP THROUGH AND DO ANY DATA CLEANING ETC ON OUR RESEARCH MAPPING DATA */
  for (var i = 0; i < links.length; i++){
    /* SAVE THE INDEX AS A UNIQUE ID FOR LATER */
    links[i]["rowid"] = i
    /* TURN OUR COMMA DELIMITED FIELDS INTO AN ARRAY AND TRIM WHITESPACE FROM ENDS */
    if (links[i][typesKey]){
      // links[i][typesKey] = $.map(links[i][typesKey].split(","), $.trim);
      links[i][typesKey] = $.map(links[i][typesKey].split(","), function(val){ 
        return val.trim().toUpperCase(); 
      });
    } else { links[i][typesKey] = []; }
    if (links[i][tagsKey]){
      // links[i][tagsKey] = $.map(links[i][tagsKey].split(","), $.trim);
      links[i][tagsKey] = $.map(links[i][tagsKey].split(","), function(val){ 
        return val.trim().toUpperCase(); 
      });
    } else { links[i][tagsKey] = []; }
    if (links[i][workstreamsKey]){
      // links[i][workstreamsKey] = $.map(links[i][workstreamsKey].split(","), $.trim);
      links[i][workstreamsKey] = $.map(links[i][workstreamsKey].split(","), function(val){ 
        return val.trim().toUpperCase(); 
      });
    } else { links[i][workstreamsKey] = []; }
  }

  /* ADD THE TOTAL NUMBER TO THE PAGE */
  $("#links-count").text(links.length);

  /* CONFIGURE OUR DATA IN CROSSFILTER */
  cf = crossfilter(links);
  cf.onChange(function(){
    updateCards();
  });
  typesDimension = cf.dimension(function(d){ return d[typesKey];}, true);
  tagsDimension = cf.dimension(function(d){ return d[tagsKey];}, true);
  workstreamsDimension = cf.dimension(function(d){ return d[workstreamsKey];}, true);

  buildFilters();
}

function buildFilters(){
  /* BUILD ARRAYS CONTAINING UNIQUE LISTS OF THINGS TO FILTER BY */
  var allTypes = [];
  var allTags = [];
  var allWorkstreams = [];
  /* CHECK THE VALUES FOR EACH DATA ROW */
  for (var i = 0; i < links.length; i++){
    /* VALUES FOR TYPES */
    var typesArray = links[i][typesKey];
    if(Array.isArray(typesArray)){
      for (var n = 0; n < typesArray.length; n++){
        if($.inArray(typesArray[n], allTypes) === -1) { allTypes.push(typesArray[n]); }
      }
    }
    /* VALUES FOR TAGS */
    var tagArray = links[i][tagsKey];
    if(Array.isArray(tagArray)){
      for (var n = 0; n < tagArray.length; n++){
        if($.inArray(tagArray[n], allTags) === -1) { allTags.push(tagArray[n]); }
      }
    }
    /* VALUES FOR WORKSTREAMS */
    var workstreamsArray = links[i][workstreamsKey];
    if(Array.isArray(workstreamsArray)){
      for (var n = 0; n < workstreamsArray.length; n++){
        if($.inArray(workstreamsArray[n], allWorkstreams) === -1) { allWorkstreams.push(workstreamsArray[n]); }
      }
    }
  }
  /* CREATE THE BUTTONS FOR THE UI */
  d3.select('#filters-types').selectAll('button')
    .data(allTypes).enter().append('button')
    .attr('type', 'button')
    .classed('btn btn-outline-info btn-sm', true)
    .attr('onClick', function(d) {
      return 'tagFilter(this,"types","' + d + '")';
    })
    .html(function(d) { return d; })
  d3.select('#filters-tags').selectAll('button')
    .data(allTags).enter().append('button')
    .attr('type', 'button')
    .classed('btn btn-outline-info btn-sm', true)
    .attr('onClick', function(d) {
      return 'tagFilter(this,"tags","' + d + '")';
    })
    .html(function(d) { return d; })
  d3.select('#filters-workstreams').selectAll('button')
    .data(allWorkstreams).enter().append('button')
    .attr('type', 'button')
    .classed('btn btn-outline-info btn-sm', true)
    .attr('onClick', function(d) {
      return 'tagFilter(this,"workstreams","' + d + '")';
    })
    .html(function(d) { return d; })    
  
  updateCards();
}



function tagFilter(button,filter,tag) {
  if(d3.select(button).classed('active')){
    /* IF ACTIVE ALREADY, DEACTIVATE FILTER */  
    setFilter(filter,null);
  } else {
    /* OTHERWISE, IF NOT ACTIVE THEN ACTIVATE FILTER */
    setFilter(filter,tag);
  }
  
  function setFilter(filterType, filterValue) {
    if(filterType === "types"){
      d3.select('#filters-types').selectAll('button').classed('active btn-outline-success', false);
      d3.select('#filters-types').selectAll('button').classed('btn-outline-info', true);
      typesDimension.filter(filterValue);
    } else if (filterType === "tags") {
      d3.select('#filters-tags').selectAll('button').classed('active btn-outline-success', false);
      d3.select('#filters-tags').selectAll('button').classed('btn-outline-info', true);
      tagsDimension.filter(filterValue);
    } else if (filterType === "workstreams") {
      d3.select('#filters-workstreams').selectAll('button').classed('active btn-outline-success', false);
      d3.select('#filters-workstreams').selectAll('button').classed('btn-outline-info', true);
      workstreamsDimension.filter(filterValue);
    } else {
      console.log("filterType value for setFilter() not recognized")
    }
    
    if(filterValue === null) {
      d3.select(button).classed('btn-outline-info', true);
      d3.select(button).classed('btn-outline-success', false);
    } else {
      d3.select(button).classed('active btn-outline-success', true);
      d3.select(button).classed('btn-outline-info', false);
    }
  }
  
}

function resetFilters(){
  /* CLEAR ALL CROSSFILTER FILTERS */
  typesDimension.filter(null);
  d3.select('#filters-types').selectAll('button').classed('active btn-outline-success', false);
  d3.select('#filters-types').selectAll('button').classed('btn-outline-info', true);
  tagsDimension.filter(null);
  d3.select('#filters-tags').selectAll('button').classed('active btn-outline-success', false);
  d3.select('#filters-tags').selectAll('button').classed('btn-outline-info', true);
  workstreamsDimension.filter(null);
  d3.select('#filters-workstreams').selectAll('button').classed('active btn-outline-success', false);
  d3.select('#filters-workstreams').selectAll('button').classed('btn-outline-info', true);
  /* DELETE ANY TEXT SEARCH AND SHOW ALL HIDDEN CARDS */
  $(".filterinput").val('');
  d3.select('#link-cards').selectAll('div.card-wrap').classed('noMatch', false)
}


function updateCards() {

  var linkCards = d3.select('#link-cards').selectAll('div.card-wrap')
        .data(cf.allFiltered(), function(d) { return d.rowid; });

  // EXIT
  linkCards.exit().remove();
  
  // no UPDATE
  
  // ENTER
  linkCards.enter().append('div')
    .attr('class', 'col-sm-6 p-0 card-wrap')
    .attr('id', function(d) { return "link-" + d["rowid"]; })
    .html(function(d) { 
        var myTypes = d[typesKey].join(", ")
        var myTags = d[tagsKey].join(", ")
        var myWorkstreams = d[workstreamsKey].join(", ")
        var html = '<div class="card mb-3 mx-1"><div class="card-body">' +
            '<span class="search-wrap">' +
              '<h6 class="card-title">' + d[titleKey] + '</h6>' +
              '<div><small>' + d[descriptionKey] + ' - ' +
              ( (!d[urlKey].length) ? '(sorry, link is missing)' : '<a target="_blank" href="' + d[urlKey] + '">link <i class="fas fa-external-link-alt"></i></a>') +
              '</small><br>' +
            '<span>' +
              '<span class="text-muted"><small>' + 
                ( (myTypes.length > 1) ?  '| &nbsp;' + '<em>' + myTypes + '</em>' : '') +
                ( (myTags.length > 1) ? '&nbsp; | &nbsp;' + '<em>' + myTags + '</em>' : '') +
                ( (myWorkstreams.length > 1) ? '&nbsp; | &nbsp;' + '<em>' + myWorkstreams + '</em>'  : '') +
                '&nbsp; |' +
              '</small></span>' +
              '</div>' +
            '</div></div>'
        return html;
      })
  
}

/* SEARCH BOX */
(function($) {
  jQuery.expr[':'].Contains = function(a,i,m){
      return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
  };
  function filterList(header, list) {
    var form = $("<form>").attr({"class":"filterform","action":"#"}),
        input = $("<input>").attr({"class":"filterinput","type":"text"});
    $(form).append(input).appendTo(header);
    $(input)
      .change( function() {
        var filters = $(this).val().match(/\S+/g);
        d3.select('#link-cards').selectAll('div.card-wrap').classed('noMatch', false)
        // is there user input in the search box?
        if(filters) {
          $.each(filters, function(index, filter){
            $matches = $(list).find('.search-wrap:Contains(' + filter + ')');
            $('.search-wrap', list).not($matches).parents('.card-wrap').addClass('noMatch');
          });
        // if no user input, show all link cards
        } else {
          d3.select('#link-cards').selectAll('div.card-wrap').classed('noMatch', false)
        }
        return false;
      })
      .keyup( function() {
        $(this).change();
      });
  }
  $(function() {
    filterList($("#form"), $("#link-cards"));
  });
}(jQuery));
