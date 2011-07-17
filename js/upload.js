
$(document).ready(function() {
  var socket = io.connect();

  socket.on('connect', function() {
    console.log('connected');
  });


  socket.on('message', function(data) {
    $('#uploaded').append($('<div><a href="/'+data+'" target="_blank">'+data+'</a></div>'));
  });


  if ($.browser.msie || $.browser.opera) {
    $(document.body).text('Your browser does not support Drag & Drop uploading.');
    return;
  }


  function handleDrag(e) {
    if (e.type == 'dragenter') {
      $('#upload').addClass('drop');
    } else if ((e.type == 'dragleave') || (e.type == 'drop')) {
      $('#upload').removeClass('drop');
    }

    e.stopPropagation();
    e.preventDefault();
  }


  function handleUploads(files) {
    for (var i = 0; i < files.length; ++i) {
      var reader = new FileReader();

      reader.onloadend = function(d) {
        socket.send(d.target.result, function(err) {
          if (!err) {
            console.log('file uploaded');
          }
        });
      };

      reader.readAsDataURL(files[i]);
    }
  }


  // Add the drag handlers to both the upload area and th fileupload area.
  // Adding it to the fileupload area is needed because it is on top of the upload area in Chrome.
  $('#upload, #fileupload').bind('dragenter', handleDrag).bind('dragleave', handleDrag).bind('dragover', handleDrag);

  $('#upload').get(0).ondrop = function(e) {
    handleDrag(e);

    if (!e.dataTransfer.files) {
      alert('Dropping files is not supported by your browser.');
      return;
    }
  
    var files = e.dataTransfer.files;

    handleUploads(files);
  };

  $('#fileupload').change(function(e) {
    handleUploads(this.files);
  }).click(function(e) {
     // Since this element is placed inside the #upload element this click will bubble though to it and we will have infinite recursion.
     // So prevent this by stopping the bubbling.
     e.stopPropagation();
  });

  if ($.browser.mozilla) {
    $('#upload').click(function() {
      $('#fileupload').click();
    });

    $('#fileupload').css('display', 'none');
  }
});

