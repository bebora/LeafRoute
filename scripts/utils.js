var dumpStats = function () {
    let totalTime = 0;
    let bestTime = Infinity;
    let worstTime = {requestTime: 0};
    let timesLength = stats.times.length;
    let errorsLength = stats.errors.length;
    for (let i=0; i < timesLength; i++) {
        let time = stats.times[i].requestTime;
        totalTime += time;
        if (time < bestTime) bestTime = time;
        if (time > worstTime.requestTime) worstTime = stats.times[i];
    }
    let result = 'Average request time: '+Math.round(totalTime/timesLength)+'ms\n'+
        'Best request time: '+bestTime+'ms\n'+
        'Worst request time: '+worstTime.requestTime+'ms (from: ' + worstTime.s_lat + ',' + worstTime.s_lon + '; to: ' + worstTime.e_lat + ',' + worstTime.e_lon + ')\n'+
        'Total requests: '+timesLength + '\n';
    let errors = 'Errors count: '+stats.errors.length + ' (' + Math.round(100*errorsLength/(errorsLength+timesLength)) + '%)\n';
    for (let i=0; i < errorsLength; i++) {
        let error = stats.errors[i];
        errors += error.errorMessage + '(from: ' + error.s_lat + ',' + error.s_lon + '; to: ' + error.e_lat + ',' + error.e_lon + '; request time: ' + error.requestTime + 'ms)\n';
    }
    raw_data = '\n-RAW-DATA-\n'+JSON.stringify(stats);
    result += errors+raw_data;
    console.log(result);
    let filename = 'stats.txt';
    let blob = new Blob([result], {type: 'text/plain;charset=utf-8'});
    saveAs(blob, filename);
};