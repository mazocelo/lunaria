const generateGETparams = (params) => {
    if (!params || Object.keys(params).length === 0) {
        return '';
    }
    
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            queryString.append(key, value);
        }
    });
    
    const result = queryString.toString();
    return result ? `?${result}` : '';
}

export default generateGETparams;