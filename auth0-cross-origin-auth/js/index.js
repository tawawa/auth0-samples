
$(document).ready(function () {
  var loader = $('#loader').hide();
  var usePasswordless = false;

  $("label").each(function() {
    var label = $(this);
    label.addClass('active highlight');
  });

  $('.tab a').on('click', function (e) {
    
    e.preventDefault();
    if (usePasswordless) return;    
    $(this).parent().addClass('active');
    $(this).parent().siblings().removeClass('active');
    
    target = $(this).attr('href');
    if (target === '#login') {
      $('#login-form').show();
      $('#login-social').show();
      $('#passwordless').show();
      $('#change-password').hide();
    }
    $('.tab-content > div').not(target).hide();
    
    $(target).fadeIn(600);
    
  });

  // Auth0 Implementation.  

  var defaultConnection = 'Username-Password-Authentication';
  var connection = config.connection ? config.connection : defaultConnection;
  var title = config.dict.signin.title;
  var params = Object.assign({
    domain: config.auth0Domain,
    clientID: config.clientID,
    redirectUri: config.callbackURL,
    responseType: config.responseType
  }, config.internalOptions);
  var webAuth = new auth0.WebAuth(params);
  var authenticate = new auth0.Authentication({
          domain: config.auth0Domain,
          clientID: config.clientID
        });
 

  if (title) {
    $("#client-title").text(title);
  }

  /*
  * Passwordless
  */

  $('#send_code').click(function (e) {
    console.log("sending code...");
    e.preventDefault();
    var emailOrPhone = $('#email-or-phone').val();
    if ($('#email-or-phone').val() !== '') {
      sendEmailOrSMS(emailOrPhone);
    } else {
      alert('Email or Phone number is required');
    }
  });

  $('#verify_code').click(function (e) {
    e.preventDefault();
    loginWithPasswordless();
  });

  /*
  * Helpers
  */

  function sendEmailOrSMS(emailOrPhone){
    var type = getEmailOrPhone(emailOrPhone);
    var startParams;
    if (type === 'email') {
      startParams = {
        connection: 'email',
        email: emailOrPhone,
        send: 'code'
      };
    } else if (type === 'sms') {
      startParams = {
        connection: 'sms',
        phoneNumber: emailOrPhone,
        send: 'code'
      };
    } else {
      displayError({description: 'Enter a valid Email or Phonenumber'});
    }
    if (startParams) {
      loader.show();
      webAuth.passwordlessStart(startParams, function(err, result) {
        if (err) {
          loader.hide();
          displayError(err);
          return;
        }
        loader.hide();
        usePasswordless = true;
        displayPasswordlessMessage(type, emailOrPhone);
        $('#login-form').hide();
        $('#login-social').hide();
        $('#enter-email-phone').hide();
        $('#enter-code').show();
      });
    }
  };
      
  function getEmailOrPhone (emailOrPhone) {
    var emailRegex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    // Accepts only Australia numbers
    var phoneNumberRegex = /(^:\+?61|62|81)?(?:\(0\)[23478]|\(?0?[23478]\)?)\d{8}/;
    if (emailRegex.test(emailOrPhone)) {
      return "email";
    } else if (phoneNumberRegex.test(emailOrPhone)){
      return "sms";
    } else {
      return "none";
    }
  };

  function loginWithPasswordless(){
    var emailOrPhone = $('#email-or-phone').val();
    var code = $('#code').val();
    var type = getEmailOrPhone(emailOrPhone);
    var verifyParams = {};

    if (type === 'email') {
      verifyParams = {
        connection: 'email',
        verificationCode: code,
        email: emailOrPhone
      };
    } else if (type === 'sms'){
        verifyParams = {
        connection: 'sms',
        verificationCode: code,
        phoneNumber: emailOrPhone,
         
      };
    } else {
      alert('Enter a valid Email or Phonenumber');
    }
    webAuth.passwordlessVerify(verifyParams, function(err){
      if (err) displayError(err);
    });  
  };

  /* Display Error / Success*/

  function displayError(err) {
    var errorMessage = document.getElementById('error-message');
    errorMessage.innerHTML = err.description;
    errorMessage.style.display = 'block';
  };

  function clearMessage() {
    var errorMessage = document.getElementById('error-message');
    errorMessage.innerHTML = '';
    errorMessage.style.display = 'none';
    var successMessage = document.getElementById('success-message');
    successMessage.innerHTML = '';
    successMessage.style.display = 'none';
  };

  function displayChangePasswordMessage(msg) {
    clearMessage();
    var successMessage = document.getElementById('success-message');
    successMessage.innerHTML = msg;
    successMessage.style.display = 'block';
  };

  function displayPasswordlessMessage(type, emailOrPhone) {
    clearMessage();
    var pwdlessMessage = document.getElementById('pwdless-message');
    var message = 'An ' + type + ' with the code has been sent to ' + emailOrPhone + '.'
    pwdlessMessage.innerHTML = message;
    pwdlessMessage.style.display = 'block';
  };

  /*
  * Social Login / Signup
  */

  $('a[href="#google"]').click(function (e) {
    e.preventDefault();
    loginWithSocial('google-oauth2');
  });

  $('a[href="#twitter"]').click(function (e) {
    e.preventDefault();
    loginWithSocial('twitter');
  });

  $('a[href="#facebook"]').click(function (e) {
    e.preventDefault();
    loginWithSocial('facebook');
  });

  function loginWithSocial(provider) {
    loader.show();
    webAuth.authorize({
      connection: provider
    }, function(err) {
      loader.hide();
      if (err) displayError(err);
    });
  };  

  /*
  * Database Login / Signup / Reset Password
  */

  $("form").submit(function () {
    var options = {};
    switch (this.id) {
      case "login-form":

        var $lg_username = $('#login_username').val();
        var $lg_password = $('#login_password').val();
  
        var $lg_password = $('#login_password').val();
        var $lg_username = $('#login_username').val();
        var options = {};//config.internalOptions;
        options.username = $lg_username;
        options.password = $lg_password;
        options.redirectURI = config.callbackURL;
        options.realm = connection;
        options.scope = 'openid email';
        webAuth.login(options, function (err, data) {
          if (err) displayError(err);
          console.log(data);
        });

        break;

      case "signup-form":
        var email = $('#signup_email').val();
        var password = $('#signup_password').val();
        var first_name = $('#signup_first_name').val();
        var last_name = $('#signup_last_name').val();

        options.email = email;
        options.password = password;
        options.user_metadata = {
          first_name: first_name,
          last_name: last_name
        };
        options.connection = connection;
        webAuth.redirect.signupAndLogin(options, function(err) {
          if (err) displayError(err);
        });
        break;
      case "lost-form":
          var email=$('#forgot-email').val();
          options.email = email;
          options.connection = connection;
          authenticate.dbConnection.changePassword(options, function (err, result) {
            if (err) {
              displayError(err);
            } else {
              $('#login-form').show();
              $('#login-social').show();
              $('#enter-email-phone').show();
              $('#change-password').hide();
              displayChangePasswordMessage(result);
            }
          });

      default:
        return false;
    }
    return false;
  });

  /*
  * Reset Password
  */

  $('a[href="#change-pwd"]').click(function (e) {
    e.preventDefault();
    $('#login-form').hide();
    $('#login-social').hide();
    $('#passwordless').hide();
    $('#change-password').show();
  });

  $('a[href="#no-code"]').click(function (e) {
    e.preventDefault();
    usePasswordless = false;
    $('#login-form').show();
    $('#login-social').show();
    $('#enter-email-phone').show();
    $('#enter-code').hide();
  });


});