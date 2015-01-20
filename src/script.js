var listenerList = [],
  selectList = document.querySelectorAll('select');

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
