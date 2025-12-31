import React, { useEffect, useRef, memo } from 'react';

const BTCChart = () => {
    const container = useRef();

    useEffect(() => {
        if (container.current && container.current.querySelector("script")) {
            return;
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": "BITSTAMP:BTCUSD",
            "interval": "W",
            "range": "ALL",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "2",
            "locale": "en",
            "enable_publishing": false,
            "hide_top_toolbar": true,
            "hide_legend": false,
            "save_image": false,
            "calendar": false,
            "hide_volume": true,
            "support_host": "https://www.tradingview.com"
        });

        if (container.current) {
            container.current.appendChild(script);
        }

    }, []);

    return (
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-xl overflow-hidden h-[500px]">
            <div className="tradingview-widget-container h-full w-full" ref={container}>
                <div className="tradingview-widget-container__widget h-full w-full"></div>
            </div>
        </div>
    );
};

export default memo(BTCChart);
