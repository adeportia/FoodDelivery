



let chartCanv = document.getElementById('chart').getContext("2d");

  let chart = new Chart(chartCanv,{
  type:'doughnut',
  options:{},
  data:{
    labels:['Commercial','Government','Private'],
    datasets:[
      {
        label:'Data showing Commercial, Government and Private Vehicle Entering TTU',
        data:[20,30,40],
        backgroundColor:[
          'rgba(242,203,7,1)',
          'rgba(2,2,54,1)',
          'rgba(254,78,78,1)',
        ]
      }
    ]
  }
})



let chartCanv2 = document.getElementById('charts').getContext("2d");

  let chart2 = new Chart(chartCanv2,{
  type:'line',
  options:{},
  data:{
    labels:['Commercial','Government','Private'],
    datasets:[
      {
        label:'Data showing Commercial, Government and Private Vehicle Entering TTU',
        data:[20,30,40],
        backgroundColor:[
          'rgba(242,203,7,1)',
          'rgba(2,2,54,1)',
          'rgba(254,78,78,1)',
        ]
      }
    ]
  }
})




