package com.voidmsg.messenger;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.voidmsg.messenger.plugins.VoidAnimusPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(VoidAnimusPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
