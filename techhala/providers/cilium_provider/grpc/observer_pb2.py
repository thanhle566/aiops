# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: observer.proto
# Protobuf Python Version: 5.27.2
"""Generated protocol buffer code."""
# from google.protobuf import runtime_version as _runtime_version
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder

"""
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    27,
    2,
    '',
    'observer.proto'
)
# @@protoc_insertion_point(imports)
"""

_sym_db = _symbol_database.Default()


from techhala.providers.cilium_provider.grpc.flow.flow_pb2 import *  # noqa
from techhala.providers.cilium_provider.grpc.relay.relay_pb2 import *  # noqa

DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(
    b'\n\x0eobserver.proto\x12\x08observer\x1a\x19google/protobuf/any.proto\x1a\x1egoogle/protobuf/wrappers.proto\x1a\x1fgoogle/protobuf/timestamp.proto\x1a google/protobuf/field_mask.proto\x1a\x0f\x66low/flow.proto\x1a\x11relay/relay.proto"\x15\n\x13ServerStatusRequest"\x9b\x02\n\x14ServerStatusResponse\x12\x11\n\tnum_flows\x18\x01 \x01(\x04\x12\x11\n\tmax_flows\x18\x02 \x01(\x04\x12\x12\n\nseen_flows\x18\x03 \x01(\x04\x12\x11\n\tuptime_ns\x18\x04 \x01(\x04\x12\x39\n\x13num_connected_nodes\x18\x05 \x01(\x0b\x32\x1c.google.protobuf.UInt32Value\x12;\n\x15num_unavailable_nodes\x18\x06 \x01(\x0b\x32\x1c.google.protobuf.UInt32Value\x12\x19\n\x11unavailable_nodes\x18\x07 \x03(\t\x12\x0f\n\x07version\x18\x08 \x01(\t\x12\x12\n\nflows_rate\x18\t \x01(\x01"\xc5\x03\n\x0fGetFlowsRequest\x12\x0e\n\x06number\x18\x01 \x01(\x04\x12\r\n\x05\x66irst\x18\t \x01(\x08\x12\x0e\n\x06\x66ollow\x18\x03 \x01(\x08\x12#\n\tblacklist\x18\x05 \x03(\x0b\x32\x10.flow.FlowFilter\x12#\n\twhitelist\x18\x06 \x03(\x0b\x32\x10.flow.FlowFilter\x12)\n\x05since\x18\x07 \x01(\x0b\x32\x1a.google.protobuf.Timestamp\x12)\n\x05until\x18\x08 \x01(\x0b\x32\x1a.google.protobuf.Timestamp\x12.\n\nfield_mask\x18\n \x01(\x0b\x32\x1a.google.protobuf.FieldMask\x12=\n\x0c\x65xperimental\x18\xe7\x07 \x01(\x0b\x32&.observer.GetFlowsRequest.Experimental\x12*\n\nextensions\x18\xf0\x93\t \x01(\x0b\x32\x14.google.protobuf.Any\x1a\x42\n\x0c\x45xperimental\x12\x32\n\nfield_mask\x18\x01 \x01(\x0b\x32\x1a.google.protobuf.FieldMaskB\x02\x18\x01J\x04\x08\x02\x10\x03"\xd6\x01\n\x10GetFlowsResponse\x12\x1a\n\x04\x66low\x18\x01 \x01(\x0b\x32\n.flow.FlowH\x00\x12-\n\x0bnode_status\x18\x02 \x01(\x0b\x32\x16.relay.NodeStatusEventH\x00\x12&\n\x0blost_events\x18\x03 \x01(\x0b\x32\x0f.flow.LostEventH\x00\x12\x12\n\tnode_name\x18\xe8\x07 \x01(\t\x12)\n\x04time\x18\xe9\x07 \x01(\x0b\x32\x1a.google.protobuf.TimestampB\x10\n\x0eresponse_types"\x9c\x01\n\x15GetAgentEventsRequest\x12\x0e\n\x06number\x18\x01 \x01(\x04\x12\r\n\x05\x66irst\x18\t \x01(\x08\x12\x0e\n\x06\x66ollow\x18\x02 \x01(\x08\x12)\n\x05since\x18\x07 \x01(\x0b\x32\x1a.google.protobuf.Timestamp\x12)\n\x05until\x18\x08 \x01(\x0b\x32\x1a.google.protobuf.Timestamp"~\n\x16GetAgentEventsResponse\x12%\n\x0b\x61gent_event\x18\x01 \x01(\x0b\x32\x10.flow.AgentEvent\x12\x12\n\tnode_name\x18\xe8\x07 \x01(\t\x12)\n\x04time\x18\xe9\x07 \x01(\x0b\x32\x1a.google.protobuf.Timestamp"\x9c\x01\n\x15GetDebugEventsRequest\x12\x0e\n\x06number\x18\x01 \x01(\x04\x12\r\n\x05\x66irst\x18\t \x01(\x08\x12\x0e\n\x06\x66ollow\x18\x02 \x01(\x08\x12)\n\x05since\x18\x07 \x01(\x0b\x32\x1a.google.protobuf.Timestamp\x12)\n\x05until\x18\x08 \x01(\x0b\x32\x1a.google.protobuf.Timestamp"~\n\x16GetDebugEventsResponse\x12%\n\x0b\x64\x65\x62ug_event\x18\x01 \x01(\x0b\x32\x10.flow.DebugEvent\x12\x12\n\tnode_name\x18\xe8\x07 \x01(\t\x12)\n\x04time\x18\xe9\x07 \x01(\x0b\x32\x1a.google.protobuf.Timestamp"\x11\n\x0fGetNodesRequest"1\n\x10GetNodesResponse\x12\x1d\n\x05nodes\x18\x01 \x03(\x0b\x32\x0e.observer.Node"\xc0\x01\n\x04Node\x12\x0c\n\x04name\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12\x0f\n\x07\x61\x64\x64ress\x18\x03 \x01(\t\x12\x1f\n\x05state\x18\x04 \x01(\x0e\x32\x10.relay.NodeState\x12\x1a\n\x03tls\x18\x05 \x01(\x0b\x32\r.observer.TLS\x12\x11\n\tuptime_ns\x18\x06 \x01(\x04\x12\x11\n\tnum_flows\x18\x07 \x01(\x04\x12\x11\n\tmax_flows\x18\x08 \x01(\x04\x12\x12\n\nseen_flows\x18\t \x01(\x04"+\n\x03TLS\x12\x0f\n\x07\x65nabled\x18\x01 \x01(\x08\x12\x13\n\x0bserver_name\x18\x02 \x01(\t"\x16\n\x14GetNamespacesRequest"@\n\x15GetNamespacesResponse\x12\'\n\nnamespaces\x18\x01 \x03(\x0b\x32\x13.observer.Namespace"/\n\tNamespace\x12\x0f\n\x07\x63luster\x18\x01 \x01(\t\x12\x11\n\tnamespace\x18\x02 \x01(\t"\xa3\x02\n\x0b\x45xportEvent\x12\x1a\n\x04\x66low\x18\x01 \x01(\x0b\x32\n.flow.FlowH\x00\x12-\n\x0bnode_status\x18\x02 \x01(\x0b\x32\x16.relay.NodeStatusEventH\x00\x12&\n\x0blost_events\x18\x03 \x01(\x0b\x32\x0f.flow.LostEventH\x00\x12\'\n\x0b\x61gent_event\x18\x04 \x01(\x0b\x32\x10.flow.AgentEventH\x00\x12\'\n\x0b\x64\x65\x62ug_event\x18\x05 \x01(\x0b\x32\x10.flow.DebugEventH\x00\x12\x12\n\tnode_name\x18\xe8\x07 \x01(\t\x12)\n\x04time\x18\xe9\x07 \x01(\x0b\x32\x1a.google.protobuf.TimestampB\x10\n\x0eresponse_types2\xed\x03\n\x08Observer\x12\x45\n\x08GetFlows\x12\x19.observer.GetFlowsRequest\x1a\x1a.observer.GetFlowsResponse"\x00\x30\x01\x12W\n\x0eGetAgentEvents\x12\x1f.observer.GetAgentEventsRequest\x1a .observer.GetAgentEventsResponse"\x00\x30\x01\x12W\n\x0eGetDebugEvents\x12\x1f.observer.GetDebugEventsRequest\x1a .observer.GetDebugEventsResponse"\x00\x30\x01\x12\x43\n\x08GetNodes\x12\x19.observer.GetNodesRequest\x1a\x1a.observer.GetNodesResponse"\x00\x12R\n\rGetNamespaces\x12\x1e.observer.GetNamespacesRequest\x1a\x1f.observer.GetNamespacesResponse"\x00\x12O\n\x0cServerStatus\x12\x1d.observer.ServerStatusRequest\x1a\x1e.observer.ServerStatusResponse"\x00\x42*Z(github.com/cilium/cilium/api/v1/observerP\x04\x62\x06proto3'
)

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, "observer_pb2", _globals)
if not _descriptor._USE_C_DESCRIPTORS:
    _globals["DESCRIPTOR"]._loaded_options = None
    _globals["DESCRIPTOR"]._serialized_options = (
        b"Z(github.com/cilium/cilium/api/v1/observer"
    )
    _globals["_GETFLOWSREQUEST_EXPERIMENTAL"].fields_by_name[
        "field_mask"
    ]._loaded_options = None
    _globals["_GETFLOWSREQUEST_EXPERIMENTAL"].fields_by_name[
        "field_mask"
    ]._serialized_options = b"\030\001"
    _globals["_SERVERSTATUSREQUEST"]._serialized_start = 190
    _globals["_SERVERSTATUSREQUEST"]._serialized_end = 211
    _globals["_SERVERSTATUSRESPONSE"]._serialized_start = 214
    _globals["_SERVERSTATUSRESPONSE"]._serialized_end = 497
    _globals["_GETFLOWSREQUEST"]._serialized_start = 500
    _globals["_GETFLOWSREQUEST"]._serialized_end = 953
    _globals["_GETFLOWSREQUEST_EXPERIMENTAL"]._serialized_start = 881
    _globals["_GETFLOWSREQUEST_EXPERIMENTAL"]._serialized_end = 947
    _globals["_GETFLOWSRESPONSE"]._serialized_start = 956
    _globals["_GETFLOWSRESPONSE"]._serialized_end = 1170
    _globals["_GETAGENTEVENTSREQUEST"]._serialized_start = 1173
    _globals["_GETAGENTEVENTSREQUEST"]._serialized_end = 1329
    _globals["_GETAGENTEVENTSRESPONSE"]._serialized_start = 1331
    _globals["_GETAGENTEVENTSRESPONSE"]._serialized_end = 1457
    _globals["_GETDEBUGEVENTSREQUEST"]._serialized_start = 1460
    _globals["_GETDEBUGEVENTSREQUEST"]._serialized_end = 1616
    _globals["_GETDEBUGEVENTSRESPONSE"]._serialized_start = 1618
    _globals["_GETDEBUGEVENTSRESPONSE"]._serialized_end = 1744
    _globals["_GETNODESREQUEST"]._serialized_start = 1746
    _globals["_GETNODESREQUEST"]._serialized_end = 1763
    _globals["_GETNODESRESPONSE"]._serialized_start = 1765
    _globals["_GETNODESRESPONSE"]._serialized_end = 1814
    _globals["_NODE"]._serialized_start = 1817
    _globals["_NODE"]._serialized_end = 2009
    _globals["_TLS"]._serialized_start = 2011
    _globals["_TLS"]._serialized_end = 2054
    _globals["_GETNAMESPACESREQUEST"]._serialized_start = 2056
    _globals["_GETNAMESPACESREQUEST"]._serialized_end = 2078
    _globals["_GETNAMESPACESRESPONSE"]._serialized_start = 2080
    _globals["_GETNAMESPACESRESPONSE"]._serialized_end = 2144
    _globals["_NAMESPACE"]._serialized_start = 2146
    _globals["_NAMESPACE"]._serialized_end = 2193
    _globals["_EXPORTEVENT"]._serialized_start = 2196
    _globals["_EXPORTEVENT"]._serialized_end = 2487
    _globals["_OBSERVER"]._serialized_start = 2490
    _globals["_OBSERVER"]._serialized_end = 2983
# @@protoc_insertion_point(module_scope)
