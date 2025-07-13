const generateGETparams = (params) => {
    let paramsString = '';
    for(const key in params){
        paramsString += `?${key}=${params[key]}&`;
    }
    return paramsString;
}

export default generateGETparams;