var listenerList = [],
  selectList = document.querySelectorAll('select');

Math.easeInOutQuad = function (time, start, delta, duration) {
  time /= duration/2;
  if (time < 1) return delta/2*time*time + start;
  time--;
  return -delta/2 * (time*(time-2) - 1) + start;
};

function ease(element, propertyName, to, duration) {
  var start = element[propertyName],
    change = to - start,
    currentTime = 0,
    increment = 10;

  var animateScroll = function(){
    currentTime += increment;
    element[propertyName] = Math.easeInOutQuad(currentTime, start, change, duration);
    if(currentTime < duration) {
      setTimeout(animateScroll, increment);
    }
  };
  animateScroll();
}

function onSelectChange(e) {
  var target = e.currentTarget || e.target;
  console.log(target.value);

  listenForChanges(false);

  for(var i = 0; i < selectList.length; i++) {
    if (selectList[i].value !== target.value) {
      selectList[i].value = target.value;
    }
  }

  listenForChanges(true);

  displayGroup(target.value);
}

function displayGroup(value) {
  var groupSizeList = document.querySelectorAll('[data-group-size]');
  for(var i = 0; i < groupSizeList.length; i++) {
    if (groupSizeList[i].getAttribute('data-group-size') === value) {
      groupSizeList[i].style.display = 'block';
    } else {
      groupSizeList[i].style.display = 'none';
    }
  }
}

function listenForChanges(isEnabled) {
  while (listenerList.length) {
    listenerList.pop().removeEventListener('change', onSelectChange);
  }
  if (isEnabled) {
    for(var i = 0; i < selectList.length; i++) {
      listenerList.push(selectList[i]);
      selectList[i].addEventListener('change', onSelectChange);
    }
  }
}

listenForChanges(true);
displayGroup(selectList[0].value);

var galleryScroll = true,
  gallery = document.querySelector('.gallery');
gallery.addEventListener('mouseover', function () {
  galleryScroll = false;
});
gallery.addEventListener('mouseout', function () {
  galleryScroll = true;
});
setInterval(function () {
  if (galleryScroll) {
    var x = gallery.scrollLeft;
    var cursor = gallery.firstElementChild;

    //find currently visible
    while (cursor && (cursor.offsetLeft - (cursor.offsetWidth / 2) < x)) cursor = cursor.nextElementSibling;

    if (cursor) {
      console.log('currently visible:', cursor.innerHTML);
      ease(gallery, 'scrollLeft', cursor.offsetLeft, 750);
    } else {
      gallery.scrollLeft = 0;
    }
  }
}, 4000);
