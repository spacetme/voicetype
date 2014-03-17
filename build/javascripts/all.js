
window.onspeechtext = function(event, text) {
}

angular.module('voicetype', [])
  .factory('exceptions', function() {
    return []
  })
  .factory('$exceptionHandler', function(exceptions) {
    return function(exception, cause) {
      var message = exception.message + ' (caused by "' + cause + '")'
      exceptions.push({ message: message })
    }
  })
  .controller('ErrorController', function($scope, exceptions) {
    $scope.exceptions = exceptions
  })
  .factory('speech', function() {
    var speech = new webkitSpeechRecognition()
    speech.lang = getLanguage()
    speech.continuous = true
    speech.interimResults = true
    window.speech = speech
    return speech

    function getLanguage() {
      var match = location.search.match(/lang=([\w\-]+)/)
      if (match) return match[1]
      else return 'en'
    }
  })
  .controller('VoiceTypingController', function($scope, speech) {
    $scope.speech = speech
    $scope.active = false
    $scope.starting = false
    speech.addEventListener('start', function() {
      $scope.$apply(function() {
        $scope.starting = false
        $scope.active = true
      })
    })
    speech.addEventListener('end', function() {
      $scope.$apply(function() {
        $scope.starting = false
        $scope.active = false
      })
    })
    var nonFinalIndex = 0
    speech.addEventListener('result', function(event) {
      $scope.$apply(function() {
        var resultIndex = event.resultIndex
        for (var i = resultIndex; i < event.results.length; i ++) {
          var current = event.results[i]
          if (current.isFinal) {
            nonFinalIndex = i + 1
            $scope.textarea.type(current[0].transcript)
            window.onspeechtext(current[0].transcript, current)
            log(current)
          } else {
            if (i < nonFinalIndex) {
              nonFinalIndex = i
            }
          }
        }
        $scope.guess = [].slice.call(event.results, nonFinalIndex).map(function(current) {
          return current[0].transcript
        }).join('')
      })
    })
    function log(current) {
      console.log([].map.call(current, function(item) {
        return item.transcript + '(' + item.confidence.toFixed(3) + ')'
      }).join(' '))
    }
    $scope.startTyping = function() {
      $scope.starting = true
      speech.start()
    }
    $scope.stopTyping = function() {
      speech.stop()
    }
  })
  .directive('typingTextarea', function() {
    return function(scope, element, attrs) {
      var el = element[0]
      scope[attrs.typingTextarea] = {
        type: preserve('scrollLeft', preserve('scrollTop', function(text) {
          var old = el.value
          var start = el.selectionStart
          var before = old.substr(0, el.selectionStart)
          var after = old.substr(el.selectionEnd)
          el.value = before + text + after
          el.selectionStart = el.selectionEnd = start + text.length
          setTimeout(function() {
            el.selectionStart = el.selectionEnd = start + text.length
          }, 0)
        }))
      }
      function preserve(name, callback) {
        return function() {
          var old = el[name]
          callback.apply(this, arguments)
          el[name] = old
        }
      }
    }
  })


;
